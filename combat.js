/* ===== THE HATS — combat engine ===== */

const Combat = {
  session: null,
  pendingAbility: null,

  startEncounter(enemyKeys) {
    const player = Game.state.player;
    const enemies = enemyKeys.map((key, idx) => {
      const tpl = ENEMY_TEMPLATES[key];
      return {
        id: 'e' + idx,
        name: tpl.name,
        hp: tpl.hp, maxHp: tpl.hp,
        atk: tpl.atk, def: tpl.def,
        abilities: tpl.abilities,
        flavor: tpl.flavor,
        corrupted: !!tpl.corrupted,
        statuses: [],
        alive: true
      };
    });

    this.session = {
      player,
      enemies,
      log: [],
      turn: 'player',
      over: false
    };

    Game.showView('combat');
    this.log('Encounter started: ' + enemies.map(e => e.name).join(', '), 'info');
    this.render();
  },

  log(text, cls) {
    this.session.log.push({ text, cls: cls || '' });
    this.renderLog();
  },

  renderLog() {
    const el = Game.els.combatLog;
    el.innerHTML = this.session.log.map(l =>
      `<div class="combat-log-line ${l.cls}">${Game.escape(l.text)}</div>`
    ).join('');
    el.scrollTop = el.scrollHeight;
  },

  render() {
    this.renderField();
    this.renderControls();
  },

  renderField() {
    const s = this.session;
    const renderCombatant = (c, isEnemy) => {
      const hpPct = Math.max(0, (c.hp / c.maxHp) * 100);
      const dead = c.hp <= 0;
      const targetable = isEnemy && !dead && this.pendingAbility;
      return `
        <div class="combatant-card ${isEnemy ? 'is-enemy' : ''} ${dead ? 'is-dead' : ''} ${targetable ? 'is-targetable' : ''}"
             data-cid="${c.id}" ${targetable ? 'tabindex="0" role="button"' : ''}>
          <div class="combatant-name-row">
            <span class="combatant-name ${c.corrupted ? 'corrupted' : ''}">${Game.escape(c.name)}</span>
            <span class="combatant-tag">${dead ? 'offline' : (c.hp) + '/' + c.maxHp}</span>
          </div>
          <div class="hud-bar-track"><div class="hud-bar-fill hp" style="width:${hpPct}%"></div></div>
          <div class="combatant-statuses">
            ${(c.statuses || []).map(st => `<span class="status-chip ${st.kind}">${st.label}${st.duration ? ' ' + st.duration : ''}</span>`).join('')}
          </div>
        </div>
      `;
    };

    Game.els.combatField.innerHTML = `
      <div class="combatant-col">
        <div class="combatant-col-label">You</div>
        ${renderCombatant(s.player, false)}
      </div>
      <div class="combatant-col">
        <div class="combatant-col-label">AI Collective units</div>
        ${s.enemies.map(e => renderCombatant(e, true)).join('')}
      </div>
    `;

    if (this.pendingAbility) {
      Game.els.combatField.querySelectorAll('.combatant-card.is-targetable').forEach(card => {
        card.addEventListener('click', () => this.resolvePlayerTurn(card.getAttribute('data-cid')));
        card.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') this.resolvePlayerTurn(card.getAttribute('data-cid'));
        });
      });
    }
  },

  renderControls() {
    const s = this.session;
    const p = s.player;
    if (s.over) { Game.els.combatControls.innerHTML = ''; return; }

    Game.els.combatControls.innerHTML = p.abilities.map(abilId => {
      const a = ABILITIES[abilId];
      const affordable = p.energy >= a.cost;
      const selected = this.pendingAbility === abilId;
      return `
        <button class="ability-btn ${selected ? 'selected' : ''}" data-abil="${abilId}" ${affordable ? '' : 'disabled'}>
          <div class="ability-name">${Game.escape(a.name)}</div>
          <div class="ability-meta"><span>${a.type}</span><span>${a.cost} en</span></div>
        </button>
      `;
    }).join('');

    Game.els.combatControls.querySelectorAll('.ability-btn').forEach(btn => {
      btn.addEventListener('click', () => this.selectAbility(btn.getAttribute('data-abil')));
    });
  },

  selectAbility(abilId) {
    const a = ABILITIES[abilId];
    if (a.target === 'self' || a.target === 'ally-or-self') {
      this.pendingAbility = null;
      this.applyPlayerAbility(abilId, this.session.player);
      this.afterPlayerAction();
      return;
    }
    if (a.target === 'all-enemies') {
      this.pendingAbility = null;
      this.session.enemies.filter(e => e.hp > 0).forEach(e => this.applyPlayerAbility(abilId, e, true));
      this.afterPlayerAction();
      return;
    }
    this.pendingAbility = abilId;
    this.render();
  },

  resolvePlayerTurn(targetId) {
    const target = this.session.enemies.find(e => e.id === targetId);
    if (!target || target.hp <= 0) return;
    const abilId = this.pendingAbility;
    this.pendingAbility = null;
    this.applyPlayerAbility(abilId, target);
    this.afterPlayerAction();
  },

  applyPlayerAbility(abilId, target) {
    const a = ABILITIES[abilId];
    const p = this.session.player;
    if (p.energy < a.cost) return;
    p.energy -= a.cost;

    if (a.heal) {
      const before = target.hp;
      target.hp = Math.min(target.maxHp, target.hp + a.heal);
      this.log(`${p.name} uses ${a.name} — restores ${target.hp - before} HP.`, 'heal');
    }
    if (a.shield) {
      this.setStatus(target, { kind: 'shielded', label: 'Shielded', amount: a.shield, duration: 1 });
      this.log(`${p.name} raises a Firewall shield (absorbs ${a.shield}).`, 'heal');
    }
    if (a.power) {
      let dmg = a.power + Math.floor(p.atk * 0.6);
      if (target.corrupted && a.tag === 'anti-machine') dmg = Math.round(dmg * 1.4);
      if (this.hasStatus(target, 'exposed')) dmg = Math.round(dmg * 1.35);
      dmg = Math.max(1, dmg - (target.def || 0));
      target.hp = Math.max(0, target.hp - dmg);
      this.log(`${p.name} uses ${a.name} on ${target.name} — ${dmg} damage.`, 'hit');
      if (a.drainEnergy) {
        p.energy = Math.min(p.maxEnergy, p.energy + a.drainEnergy);
        this.log(`${p.name} drains ${a.drainEnergy} energy.`, 'info');
      }
      if (a.dot) {
        this.setStatus(target, { kind: 'dot', label: 'Worm', amount: a.dot, duration: a.dotDuration });
      }
      if (target.hp <= 0) {
        target.alive = false;
        this.log(`${target.name} drops offline.`, 'system');
      }
    }
    if (a.status === 'exposed') {
      this.setStatus(target, { kind: 'exposed', label: 'Exposed', duration: a.duration });
      this.log(`${p.name} uses Expose on ${target.name} — its defenses are public now.`, 'info');
    }
    if (a.status === 'leaked') {
      this.setStatus(target, { kind: 'exposed', label: 'Leaked', duration: a.duration });
      this.log(`${p.name} leaks ${target.name}'s strongest subroutine. It's disabled.`, 'info');
    }
    if (a.status === 'pacified') {
      this.setStatus(target, { kind: 'shielded', label: 'Pacified', duration: a.duration });
      this.log(`${p.name} attempts AI negotiation with ${target.name}. It hesitates.`, 'info');
    }
    if (a.status === 'cloaked') {
      this.setStatus(p, { kind: 'shielded', label: 'Cloaked', duration: a.duration });
      this.log(`${p.name} vanishes into shadow cloak.`, 'info');
    }

    this.render();
  },

  hasStatus(c, kind) {
    return (c.statuses || []).some(s => s.kind === kind);
  },

  setStatus(c, status) {
    c.statuses = c.statuses || [];
    c.statuses = c.statuses.filter(s => s.label !== status.label);
    c.statuses.push(status);
  },

  tickStatuses(c) {
    if (!c.statuses) return;
    c.statuses.forEach(s => {
      if (s.kind === 'dot' && c.hp > 0) {
        c.hp = Math.max(0, c.hp - s.amount);
        this.log(`${c.name} takes ${s.amount} worm damage.`, 'hit');
        if (c.hp <= 0) { c.alive = false; this.log(`${c.name} drops offline.`, 'system'); }
      }
    });
    c.statuses = c.statuses
      .map(s => ({ ...s, duration: s.duration != null ? s.duration - 1 : undefined }))
      .filter(s => s.duration == null || s.duration > 0);
  },

  afterPlayerAction() {
    this.render();
    if (this.checkVictory()) return;
    setTimeout(() => this.enemyTurn(), 500);
  },

  enemyTurn() {
    const s = this.session;
    const livingEnemies = s.enemies.filter(e => e.hp > 0);
    livingEnemies.forEach(e => this.tickStatuses(e));
    this.tickStatuses(s.player);

    livingEnemies.filter(e => e.hp > 0).forEach(e => {
      if (e.statuses && e.statuses.find(st => st.label === 'Pacified')) {
        this.log(`${e.name} hesitates, pacified, and does nothing.`, 'info');
        return;
      }
      const abilKey = e.abilities[Math.floor(Math.random() * e.abilities.length)];
      const ability = ENEMY_ABILITIES[abilKey];
      let dmg = ability.power + Math.floor(e.atk * 0.3) - Math.floor(s.player.def * 0.5);
      dmg = Math.max(1, dmg);

      const shieldStatus = s.player.statuses && s.player.statuses.find(st => st.label === 'Shielded' || st.label === 'Firewall shield' || st.label === 'Cloaked');
      if (shieldStatus && shieldStatus.amount) {
        const absorbed = Math.min(dmg, shieldStatus.amount);
        dmg -= absorbed;
        shieldStatus.amount -= absorbed;
        this.log(`${e.name} uses ${ability.name} — shield absorbs ${absorbed}.`, 'info');
      }

      s.player.hp = Math.max(0, s.player.hp - dmg);
      this.log(`${e.name} uses ${ability.name} on ${s.player.name} — ${dmg} damage.`, 'hit');
    });

    Game.renderHud();
    this.render();
    this.checkVictory();
  },

  checkVictory() {
    const s = this.session;
    if (s.player.hp <= 0) {
      s.over = true;
      this.log('Connection lost. Crown forces a hard reboot.', 'system');
      this.render();
      return true;
    }
    if (s.enemies.every(e => e.hp <= 0)) {
      s.over = true;
      this.log('All hostile units offline.', 'system');
      this.render();
      setTimeout(() => Game.playNullspaceTeaser(() => Game.goToEnd()), 1400);
      return true;
    }
    return false;
  }
};
