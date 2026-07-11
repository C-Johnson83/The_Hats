/* ===== THE HATS — combat engine ===== */

const Combat = {
  session: null,
  pending: null,

  startEncounter(enemyKeys, label) {
    const p = Game.state.player;
    p.statuses = [];
    const enemies = enemyKeys.map((key, idx) => {
      const tpl = ENEMY_TEMPLATES[key];
      return {
        id: 'e' + idx, key,
        name: tpl.name, hp: tpl.hp, maxHp: tpl.hp,
        atk: tpl.atk, def: tpl.def,
        abilities: [...tpl.abilities],
        flavor: tpl.flavor,
        corrupted: !!tpl.corrupted,
        isBoss: !!tpl.isBoss,
        statuses: [], alive: true
      };
    });
    this.session = { player: p, enemies, log: [], over: false, label: label || 'Encounter' };
    Game.showView('combat');
    Game.renderHud();
    this.log('— ' + (label || 'Encounter') + ' —', 'info');
    this.render();
  },

  log(text, cls) {
    this.session.log.push({ text, cls: cls || '' });
    this.renderLog();
  },

  renderLog() {
    const el = Game.els.combatLog;
    el.innerHTML = this.session.log.slice(-18).map(l =>
      '<div class="combat-log-line ' + l.cls + '">' + Game.esc(l.text) + '</div>'
    ).join('');
    el.scrollTop = el.scrollHeight;
  },

  render() { this.renderField(); this.renderControls(); },

  renderField() {
    const s = this.session;
    const mkBar = (cur, max, cls) => {
      const pct = Math.max(0, Math.min(100, (cur / max) * 100));
      return '<div class="hud-bar-track"><div class="hud-bar-fill ' + cls + '" style="width:' + pct + '%"></div></div>';
    };
    const mkCard = (c, isEnemy) => {
      const dead = c.hp <= 0;
      const targetable = isEnemy && !dead && this.pending;
      const chips = (c.statuses || []).map(st =>
        '<span class="status-chip ' + st.kind + '">' + Game.esc(st.label) + (st.duration ? ' ' + st.duration : '') + '</span>'
      ).join('');
      return '<div class="combatant-card' +
        (isEnemy ? ' is-enemy' : '') +
        (dead ? ' is-dead' : '') +
        (targetable ? ' is-targetable' : '') +
        (c.isBoss ? ' is-boss' : '') +
        '" data-cid="' + c.id + '"' +
        (targetable ? ' tabindex="0" role="button"' : '') + '>' +
        '<div class="combatant-name-row">' +
          '<span class="combatant-name' + (c.corrupted ? ' corrupted' : '') + '">' + Game.esc(c.name) + '</span>' +
          '<span class="combatant-tag">' + (dead ? 'offline' : c.hp + '/' + c.maxHp) + '</span>' +
        '</div>' +
        mkBar(c.hp, c.maxHp, 'hp') +
        (chips ? '<div class="combatant-statuses">' + chips + '</div>' : '') +
        (c.flavor && !dead ? '<div class="combatant-flavor">' + Game.esc(c.flavor) + '</div>' : '') +
        '</div>';
    };
    Game.els.combatField.innerHTML =
      '<div class="combatant-col"><div class="combatant-col-label">You</div>' + mkCard(s.player, false) + '</div>' +
      '<div class="combatant-col"><div class="combatant-col-label">' + Game.esc(s.label) + '</div>' +
        s.enemies.map(e => mkCard(e, true)).join('') +
      '</div>';

    if (this.pending) {
      Game.els.combatField.querySelectorAll('.is-targetable').forEach(card => {
        card.addEventListener('click', () => this.resolveOnTarget(card.dataset.cid));
        card.addEventListener('keydown', ev => {
          if (ev.key === 'Enter' || ev.key === ' ') this.resolveOnTarget(card.dataset.cid);
        });
      });
    }
  },

  renderControls() {
    const s = this.session;
    if (s.over) { Game.els.combatControls.innerHTML = ''; return; }
    const p = s.player;
    Game.els.combatControls.innerHTML = p.abilities.map(id => {
      const a = ABILITIES[id];
      const canAfford = p.energy >= a.cost;
      const sel = this.pending === id;
      return '<button class="ability-btn' + (sel ? ' selected' : '') + '" data-abil="' + id + '"' +
        (canAfford ? '' : ' disabled') + ' title="' + Game.esc(a.desc) + '">' +
        '<div class="ability-name">' + Game.esc(a.name) + '</div>' +
        '<div class="ability-meta"><span class="ability-type-tag ' + a.type + '">' + a.type + '</span>' +
        '<span>' + a.cost + ' en</span></div></button>';
    }).join('');
    Game.els.combatControls.querySelectorAll('.ability-btn').forEach(btn => {
      btn.addEventListener('click', () => this.selectAbility(btn.dataset.abil));
    });
  },

  selectAbility(id) {
    const a = ABILITIES[id];
    const p = this.session.player;
    if (p.energy < a.cost) return;
    if (a.target === 'self') {
      this.pending = null;
      p.energy -= a.cost;
      this.applyAbility(id, p, false);
      this.afterPlayerAction();
      return;
    }
    if (a.target === 'all-enemies') {
      this.pending = null;
      p.energy -= a.cost;
      const living = this.session.enemies.filter(e => e.hp > 0);
      living.forEach(e => this.applyAbility(id, e, true));
      this.log(p.name + ' uses ' + a.name + ' on all targets!', 'hit');
      this.afterPlayerAction();
      return;
    }
    this.pending = id;
    this.render();
  },

  resolveOnTarget(cid) {
    const target = this.session.enemies.find(e => e.id === cid);
    if (!target || target.hp <= 0) return;
    const id = this.pending;
    this.pending = null;
    const p = this.session.player;
    p.energy -= ABILITIES[id].cost;
    this.applyAbility(id, target, false);
    this.afterPlayerAction();
  },

  applyAbility(id, target, isAoePart) {
    const a = ABILITIES[id];
    const p = this.session.player;
    const isPlayer = target === p;

    if (a.heal && isPlayer) {
      const gained = Math.min(target.maxHp - target.hp, a.heal);
      target.hp += gained;
      this.log(p.name + ' uses ' + a.name + ' — +' + gained + ' HP.', 'heal');
    }
    if (a.shield && isPlayer) {
      this.setStatus(p, { kind: 'shielded', label: 'Shield', amount: a.shield, duration: a.duration || 1 });
      this.log(p.name + ' raises ' + a.name + ' (absorbs ' + a.shield + ').', 'heal');
    }
    if (a.status === 'linked' && isPlayer) {
      this.setStatus(p, { kind: 'linked', label: 'Linked', regenAmount: 15, duration: 2 });
      this.log(p.name + ' links to The Mesh — energy regenerating.', 'info');
    }
    if (a.status === 'cloaked' && isPlayer) {
      this.setStatus(p, { kind: 'cloaked', label: 'Cloaked', duration: 1 });
      this.log(p.name + ' vanishes into shadow cloak.', 'info');
    }
    if (a.status === 'phased' && isPlayer) {
      this.setStatus(p, { kind: 'phased', label: 'Phased', duration: 1 });
      this.log(p.name + ' phases into Nullspace — immune this turn.', 'info');
    }

    if (a.power && !isPlayer) {
      let dmg = a.power + Math.floor(p.atk * 0.5);
      if (this.hasStatus(p, 'cloaked')) { dmg = Math.round(dmg * 1.5); this.clearStatus(p, 'cloaked'); }
      if (a.tag === 'anti-machine' && target.corrupted) dmg = Math.round(dmg * 1.45);
      if (this.hasStatus(target, 'exposed')) dmg = Math.round(dmg * 1.35);
      if (!a.ignoresDef) dmg = Math.max(1, dmg - target.def);
      else dmg = Math.max(1, dmg);
      target.hp = Math.max(0, target.hp - dmg);
      if (!isAoePart) this.log(p.name + ' \u2192 ' + a.name + ' on ' + target.name + ': ' + dmg + ' dmg.', 'hit');
      if (a.drainEnergy) {
        p.energy = Math.min(p.maxEnergy, p.energy + a.drainEnergy);
        if (!isAoePart) this.log('  +' + a.drainEnergy + ' energy drained.', 'info');
      }
      if (a.healSelf) {
        const gained = Math.min(p.maxHp - p.hp, a.healSelf);
        p.hp += gained;
        if (!isAoePart) this.log('  +' + gained + ' HP absorbed.', 'heal');
      }
      if (a.dot) this.setStatus(target, { kind: 'dot', label: 'Worm', amount: a.dot, duration: a.dotDuration });
      if (target.hp <= 0) { target.alive = false; this.log(target.name + ' \u2014 offline.', 'system'); }
    }

    if (!isPlayer) {
      if (a.status === 'exposed') { this.setStatus(target, { kind: 'exposed', label: 'Exposed', duration: a.duration }); this.log(p.name + ' exposes ' + target.name + '.', 'info'); }
      if (a.status === 'leaked') { this.setStatus(target, { kind: 'leaked', label: 'Leaked', duration: a.duration }); this.log(target.name + "'s attack reduced.", 'info'); }
      if (a.status === 'pacified') { this.setStatus(target, { kind: 'pacified', label: 'Pacified', duration: a.duration }); this.log(target.name + ' hesitates.', 'info'); }
      if (a.status === 'tricked') { this.setStatus(target, { kind: 'tricked', label: 'Tricked', duration: 1 }); this.log(target.name + ' skips next turn.', 'info'); }
      if (a.status === 'confused') { this.setStatus(target, { kind: 'confused', label: 'Confused', duration: 1 }); this.log(target.name + ' is confused.', 'info'); }
    }

    this.render();
    Game.renderHud();
  },

  afterPlayerAction() {
    this.render();
    Game.renderHud();
    if (this.checkEnd()) return;
    setTimeout(() => this.enemyTurn(), 600);
  },

  enemyTurn() {
    const s = this.session;
    const living = s.enemies.filter(e => e.hp > 0);
    living.forEach(e => this.tickStatuses(e));
    this.tickStatuses(s.player);

    living.filter(e => e.hp > 0).forEach(e => {
      if (this.hasStatus(e, 'pacified') || this.hasStatus(e, 'tricked') || this.hasStatus(e, 'confused')) {
        this.log(e.name + ' — suppressed, skips turn.', 'info');
        return;
      }
      if (this.hasStatus(s.player, 'phased')) {
        this.log(e.name + ' attacks — ' + s.player.name + ' is phased, no damage.', 'info');
        return;
      }
      const numActions = e.isBoss ? 2 : 1;
      for (let i = 0; i < numActions; i++) {
        if (s.player.hp <= 0) break;
        const abilKey = e.abilities[Math.floor(Math.random() * e.abilities.length)];
        const eAbil = ENEMY_ABILITIES[abilKey];
        let dmg = eAbil.power + Math.floor(e.atk * 0.35);
        if (this.hasStatus(e, 'leaked')) dmg = Math.floor(dmg * 0.65);
        if (eAbil.dot) {
          this.setStatus(s.player, { kind: 'dot', label: 'Corrupted', amount: eAbil.dot, duration: eAbil.dotDuration || 2 });
          this.log(e.name + ' corrupts ' + s.player.name + "'s Crown.", 'hit');
        }
        dmg = Math.max(1, dmg - Math.floor(s.player.def * 0.45));
        const shield = s.player.statuses && s.player.statuses.find(st => st.kind === 'shielded' && st.amount > 0);
        if (shield) {
          const absorbed = Math.min(dmg, shield.amount);
          dmg -= absorbed;
          shield.amount -= absorbed;
          if (shield.amount <= 0) this.clearStatus(s.player, 'shielded');
          if (absorbed > 0) this.log(e.name + ' attacks — shield absorbs ' + absorbed + '.', 'info');
        }
        if (dmg > 0) {
          s.player.hp = Math.max(0, s.player.hp - dmg);
          this.log(e.name + ' uses ' + eAbil.name + ' \u2014 ' + dmg + ' dmg.', 'hit');
        }
      }
    });

    this.render();
    Game.renderHud();
    this.checkEnd();
  },

  tickStatuses(c) {
    if (!c.statuses || c.statuses.length === 0) return;
    c.statuses.forEach(st => {
      if (st.kind === 'dot' && c.hp > 0) {
        c.hp = Math.max(0, c.hp - st.amount);
        this.log(c.name + ' takes ' + st.amount + ' DoT.', 'hit');
        if (c.hp <= 0) { c.alive = false; this.log(c.name + ' \u2014 offline.', 'system'); }
      }
      if (st.kind === 'linked') {
        const gained = Math.min(c.maxEnergy - c.energy, st.regenAmount || 15);
        c.energy += gained;
        this.log('Mesh link \u2014 +' + gained + ' energy.', 'heal');
      }
    });
    c.statuses = c.statuses
      .map(st => ({ ...st, duration: st.duration != null ? st.duration - 1 : undefined }))
      .filter(st => st.duration == null || st.duration > 0);
  },

  checkEnd() {
    const s = this.session;
    if (s.player.hp <= 0) {
      s.over = true;
      this.log('Crown forced offline.', 'system');
      this.render();
      setTimeout(() => Game.onCombatDefeat(), 1200);
      return true;
    }
    if (s.enemies.every(e => e.hp <= 0)) {
      s.over = true;
      this.log('All hostiles offline. Area clear.', 'system');
      this.render();
      setTimeout(() => Game.onCombatVictory(), 1200);
      return true;
    }
    return false;
  },

  hasStatus(c, kind) { return (c.statuses || []).some(s => s.kind === kind); },
  setStatus(c, st) { c.statuses = (c.statuses || []).filter(s => s.label !== st.label); c.statuses.push(st); },
  clearStatus(c, kind) { c.statuses = (c.statuses || []).filter(s => s.kind !== kind); }
};
