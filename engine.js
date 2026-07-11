/* ===== THE HATS — full game engine ===== */

const Game = {
  state: {
    handle: '',
    classId: null,
    player: null,
    reputation: { white: 0, gray: 0, black: 0 },
    endingScores: { white: 0, black: 0, gray: 0, machine: 0, ghost: 0, freedom: 0 },
    actIndex: 0,
    sceneId: null,
    combatIndex: 0,
    ghostwalkerUnlocked: false,
    flags: {}
  },

  init() {
    this.cacheEls();
    this.bindGlobal();
    this.showView('boot');
    this.runBoot();
  },

  cacheEls() {
    this.els = {
      views: document.querySelectorAll('.view'),
      bootAscii: document.getElementById('boot-ascii'),
      bootLines: document.getElementById('boot-lines'),
      bootEnter: document.getElementById('btn-boot-enter'),
      btnNewGame: document.getElementById('btn-new-game'),
      classGrid: document.getElementById('class-grid'),
      handleInput: document.getElementById('handle-input'),
      btnConfirmClass: document.getElementById('btn-confirm-class'),
      hud: document.getElementById('hud'),
      sceneHeader: document.getElementById('scene-header'),
      sceneLog: document.getElementById('scene-log'),
      sceneChoices: document.getElementById('scene-choices'),
      combatField: document.getElementById('combat-field'),
      combatLog: document.getElementById('combat-log'),
      combatControls: document.getElementById('combat-controls'),
      nullspaceText: document.getElementById('nullspace-text'),
      unlockTitle: document.getElementById('unlock-title'),
      unlockDesc: document.getElementById('unlock-desc'),
      unlockAbilities: document.getElementById('unlock-abilities'),
      btnUnlockContinue: document.getElementById('btn-unlock-continue'),
      endingsGrid: document.getElementById('endings-grid'),
      endEyebrow: document.getElementById('end-eyebrow'),
      endTitle: document.getElementById('end-title'),
      endBody: document.getElementById('end-body'),
      endStats: document.getElementById('end-stats'),
      endEpilogue: document.getElementById('end-epilogue'),
      btnRestart: document.getElementById('btn-restart')
    };
  },

  bindGlobal() {
    this.els.btnNewGame.addEventListener('click', () => this.goToCharCreate());
    this.els.handleInput.addEventListener('input', () => this.validateCharCreate());
    this.els.btnConfirmClass.addEventListener('click', () => this.confirmClass());
    this.els.bootEnter.addEventListener('click', () => this.showView('title'));
    this.els.btnRestart.addEventListener('click', () => location.reload());
    this.els.btnUnlockContinue.addEventListener('click', () => this.afterGhostwalkerUnlock());
  },

  showView(name) {
    this.els.views.forEach(v => v.classList.remove('view-active'));
    const el = document.getElementById('view-' + name);
    if (el) { el.classList.add('view-active'); window.scrollTo(0, 0); }
  },

  esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },

  /* ── BOOT ── */
  runBoot() {
    this.els.bootAscii.textContent = BOOT_ASCII;
    let i = 0;
    const next = () => {
      if (i >= BOOT_LINES.length) {
        this.els.bootEnter.classList.add('is-visible');
        return;
      }
      const line = BOOT_LINES[i];
      const div = document.createElement('div');
      div.className = 'boot-line';
      const prefix = line.cls === 'ok' ? '[ok] ' : line.cls === 'warn' ? '[!] ' : '> ';
      div.innerHTML = `<span class="${line.cls}">${prefix}${this.esc(line.text)}</span>`;
      this.els.bootLines.appendChild(div);
      i++;
      setTimeout(next, 210);
    };
    next();
  },

  /* ── CHARACTER CREATION ── */
  goToCharCreate() {
    this.renderClassGrid();
    this.showView('charcreate');
  },

  renderClassGrid() {
    this.els.classGrid.innerHTML = '';
    Object.values(CLASSES).filter(c => !c.locked).forEach(cls => {
      const card = document.createElement('button');
      card.className = 'class-card';
      card.dataset.class = cls.id;
      card.innerHTML = `
        <div class="class-card-name">${this.esc(cls.name)}</div>
        <div class="class-card-tag">${this.esc(cls.tag)}</div>
        <div class="class-card-desc">${this.esc(cls.desc)}</div>
        <div class="class-card-stats">
          <span class="stat-pip">HP ${cls.baseHP}</span>
          <span class="stat-pip">EN ${cls.baseEnergy}</span>
          <span class="stat-pip">ATK ${cls.statline.atk}</span>
          <span class="stat-pip">DEF ${cls.statline.def}</span>
          <span class="stat-pip">INT ${cls.statline.int}</span>
        </div>`;
      card.addEventListener('click', () => {
        this.els.classGrid.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.state.classId = cls.id;
        this.validateCharCreate();
      });
      this.els.classGrid.appendChild(card);
    });
  },

  validateCharCreate() {
    this.els.btnConfirmClass.disabled = !(this.els.handleInput.value.trim() && this.state.classId);
  },

  confirmClass() {
    this.state.handle = this.els.handleInput.value.trim() || 'operator';
    const cls = CLASSES[this.state.classId];
    this.state.player = {
      name: this.state.handle,
      classId: cls.id, className: cls.name,
      hp: cls.baseHP, maxHp: cls.baseHP,
      energy: cls.baseEnergy, maxEnergy: cls.baseEnergy,
      atk: cls.statline.atk, def: cls.statline.def, int: cls.statline.int,
      abilities: [...cls.abilities], statuses: []
    };
    this.startAct(0);
  },

  /* ── HUD ── */
  renderHud() {
    const p = this.state.player;
    const rep = this.state.reputation;
    const act = ACTS[this.state.actIndex];
    const bar = (val, maxVal, cls) => {
      const pct = Math.max(0, Math.min(100, (val / maxVal) * 100));
      return `<div class="hud-bar-track"><div class="hud-bar-fill ${cls}" style="width:${pct}%"></div></div>`;
    };
    const repPct = (val) => Math.max(0, Math.min(100, 50 + val * 1.5));

    this.els.hud.innerHTML = `
      <div class="hud-handle">${this.esc(p.name)}</div>
      <div class="hud-class">${this.esc(p.className)}</div>
      <div class="hud-act">${this.esc(act ? act.title : '')}</div>
      <div class="hud-bar-row">
        <div class="hud-bar-label"><span>HP</span><span>${p.hp}/${p.maxHp}</span></div>
        ${bar(p.hp, p.maxHp, 'hp')}
      </div>
      <div class="hud-bar-row">
        <div class="hud-bar-label"><span>Energy</span><span>${p.energy}/${p.maxEnergy}</span></div>
        ${bar(p.energy, p.maxEnergy, 'energy')}
      </div>
      <div class="hud-rep-title">Faction standing</div>
      ${['white','gray','black'].map(k => `
        <div class="hud-rep-row">
          <span class="hud-rep-name" style="color:var(--${k === 'white' ? 'white-hat' : k === 'gray' ? 'gray-hat' : 'black-hat'})">${k.charAt(0).toUpperCase() + k.slice(1)} Hats</span>
          <div class="hud-rep-track"><div class="hud-rep-fill" style="width:${repPct(rep[k])}%;background:var(--${k === 'white' ? 'white-hat' : k === 'gray' ? 'gray-hat' : 'black-hat'})"></div></div>
        </div>`).join('')}
      ${this.state.ghostwalkerUnlocked ? '<div class="hud-ghostwalker">Ghostwalker unlocked</div>' : ''}
    `;
  },

  /* ── ACT MANAGEMENT ── */
  startAct(index) {
    this.state.actIndex = index;
    const act = ACTS[index];
    this.state.combatIndex = 0;
    // restore HP/energy between acts (partial heal)
    if (this.state.player && index > 0) {
      const p = this.state.player;
      p.hp = Math.min(p.maxHp, Math.floor(p.hp + p.maxHp * 0.4));
      p.energy = Math.min(p.maxEnergy, p.energy + Math.floor(p.maxEnergy * 0.5));
      p.statuses = [];
    }
    this.renderHud();
    this.showView('hub');
    this.els.sceneLog.innerHTML = '';
    this.renderSceneHeader(act.title);
    this.runScene('start');
  },

  renderSceneHeader(title) {
    this.els.sceneHeader.innerHTML = `<div class="scene-act-label">${this.esc(title)}</div>`;
  },

  /* ── SCENE SYSTEM ── */
  runScene(sceneId) {
    const act = ACTS[this.state.actIndex];
    const node = act.scenes[sceneId];
    if (!node) return;
    this.state.sceneId = sceneId;
    this.els.sceneChoices.innerHTML = '';

    let delay = 0;
    (node.lines || []).forEach(line => {
      setTimeout(() => this.appendLine(line), delay);
      delay += 500;
    });

    setTimeout(() => {
      if (node.action === 'nullspace-transition') {
        this.playNullspace(() => {
          if (node.next) this.runScene(node.next);
        });
        return;
      }
      if (node.action === 'unlock-ghostwalker') {
        this.showGhostwalkerUnlock(node.next);
        return;
      }

      if (node.choices) {
        if (sceneId === 'final_choice') {
          this.renderFinalChoices();
        } else {
          this.renderChoices(node.choices);
        }
      } else if (node.next) {
        this.runScene(node.next);
      } else if (node.action === 'next-act') {
        this.showNextActButton();
      }
    }, delay + 200);
  },

  appendLine(line) {
    const div = document.createElement('div');
    div.className = 'scene-line';
    const isNarration = line.speaker === 'narration';
    const speakerLabel = line.name || (!isNarration ? line.speaker : '');
    div.innerHTML = `
      ${speakerLabel ? `<div class="scene-speaker ${line.speaker}">${this.esc(speakerLabel)}</div>` : ''}
      <div class="scene-text ${isNarration ? 'narration' : ''} ${line.speaker === 'ghost' ? 'ghost-text' : ''}">${this.esc(line.text)}</div>`;
    this.els.sceneLog.appendChild(div);
    this.els.sceneLog.scrollTop = this.els.sceneLog.scrollHeight;
  },

  renderChoices(choices) {
    this.els.sceneChoices.innerHTML = '';
    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `
        ${choice.tag ? `<span class="choice-tag ${choice.tag}">${choice.tag}</span>` : ''}
        <span>${this.esc(choice.label)}</span>`;
      btn.addEventListener('click', () => this.handleChoice(choice));
      this.els.sceneChoices.appendChild(btn);
    });
  },

  handleChoice(choice) {
    this.els.sceneChoices.innerHTML = '';

    // apply rep
    if (choice.rep) {
      Object.keys(choice.rep).forEach(k => { this.state.reputation[k] = (this.state.reputation[k] || 0) + choice.rep[k]; });
    }
    // apply ending scores
    if (choice.scores) {
      Object.keys(choice.scores).forEach(k => { this.state.endingScores[k] = (this.state.endingScores[k] || 0) + choice.scores[k]; });
    }
    this.renderHud();

    if (choice.action === 'combat') {
      this.state.combatIndex = choice.combatIndex;
      const act = ACTS[this.state.actIndex];
      const enc = act.combatEncounters[choice.combatIndex];
      Combat.startEncounter(enc.enemies, enc.label);
      return;
    }

    if (choice.next) this.runScene(choice.next);
  },

  showNextActButton() {
    this.els.sceneChoices.innerHTML = '';
    const nextIndex = this.state.actIndex + 1;
    if (nextIndex < ACTS.length) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.textContent = `Continue to ${ACTS[nextIndex].title}`;
      btn.addEventListener('click', () => this.startAct(nextIndex));
      this.els.sceneChoices.appendChild(btn);
    } else {
      this.showEndingsScreen();
    }
  },

  /* ── POST COMBAT ROUTING ── */
  onCombatVictory() {
    const actIndex = this.state.actIndex;
    const combatIndex = this.state.combatIndex;
    this.renderHud();
    this.showView('hub');

    const postSceneMap = {
      '0-0': 'post_combat_1',
      '1-0': 'post_combat_2a',
      '1-2': 'post_combat_2b',
      '2-0': 'post_combat_3a',
      '2-1': 'post_combat_3b',
      '2-2': 'ghostwalker_unlock',
      '3-0': 'pre_boss',
      '3-1': 'post_final_combat'
    };

    const key = `${actIndex}-${combatIndex}`;
    const postScene = postSceneMap[key];

    if (postScene) {
      setTimeout(() => this.runScene(postScene), 600);
    } else {
      this.showNextActButton();
    }
  },

  onCombatDefeat() {
    this.showView('hub');
    this.els.sceneChoices.innerHTML = '';
    this.appendLine({ speaker: 'narration', text: 'Your Crown forces a reboot. You come back online, damaged but functional. The encounter isn\'t over.' });
    // restore some HP and let them retry
    const p = this.state.player;
    p.hp = Math.floor(p.maxHp * 0.4);
    p.energy = Math.floor(p.maxEnergy * 0.6);
    p.statuses = [];
    this.renderHud();
    setTimeout(() => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.textContent = 'Try again';
      btn.addEventListener('click', () => {
        const act = ACTS[this.state.actIndex];
        const enc = act.combatEncounters[this.state.combatIndex];
        Combat.startEncounter(enc.enemies, enc.label);
      });
      this.els.sceneChoices.appendChild(btn);
    }, 1500);
  },

  /* ── NULLSPACE TRANSITION ── */
  playNullspace(onDone) {
    this.showView('nullspace');
    document.body.classList.add('ghost-rising');
    this.els.nullspaceText.innerHTML = '';
    let delay = 0;
    NULLSPACE_TEASER.forEach(frag => {
      setTimeout(() => {
        const span = document.createElement('span');
        span.className = 'frag' + (frag.cls ? ' ' + frag.cls : '');
        span.textContent = frag.text;
        this.els.nullspaceText.appendChild(span);
      }, delay);
      delay += 1200;
    });
    setTimeout(() => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary nullspace-continue';
      btn.textContent = 'Go deeper.';
      btn.addEventListener('click', () => {
        document.body.classList.remove('ghost-rising');
        this.showView('hub');
        onDone();
      });
      this.els.nullspaceText.appendChild(btn);
    }, delay + 400);
  },

  /* ── GHOSTWALKER UNLOCK ── */
  showGhostwalkerUnlock(nextScene) {
    this.state.ghostwalkerUnlocked = true;
    const cls = CLASSES.ghostwalker;
    this.els.unlockTitle.textContent = cls.name;
    this.els.unlockDesc.textContent = cls.unlockText;
    this.els.unlockAbilities.innerHTML = cls.abilities.map(id => {
      const a = ABILITIES[id];
      return `<div class="unlock-ability"><span class="unlock-ability-name">${a.name}</span><span class="unlock-ability-desc">${a.desc}</span></div>`;
    }).join('');
    this._afterUnlockScene = nextScene;
    this.showView('unlock');
  },

  afterGhostwalkerUnlock() {
    // add ghostwalker abilities to player
    const player = this.state.player;
    const gwAbilities = CLASSES.ghostwalker.abilities;
    gwAbilities.forEach(id => { if (!player.abilities.includes(id)) player.abilities.push(id); });
    // optionally bump stats slightly
    player.maxHp += 15;
    player.hp = Math.min(player.maxHp, player.hp + 15);
    player.maxEnergy += 10;
    player.energy = Math.min(player.maxEnergy, player.energy + 10);
    this.renderHud();
    this.showView('hub');
    if (this._afterUnlockScene) this.runScene(this._afterUnlockScene);
  },

  /* ── ENDINGS ── */
  showEndingsScreen() {
    this.showView('endings');
    // build final_choice options dynamically from scores
    const scores = this.state.endingScores;
    const available = Object.keys(ENDINGS).filter(k => scores[k] >= ENDING_THRESHOLD);
    // always give at least 2 options — add top 2 scorers even below threshold
    if (available.length < 2) {
      const sorted = Object.keys(scores).sort((a,b) => scores[b] - scores[a]);
      sorted.forEach(k => { if (!available.includes(k)) available.push(k); if (available.length >= 3) return; });
    }

    this.els.endingsGrid.innerHTML = '';
    available.forEach(endId => {
      const e = ENDINGS[endId];
      const sc = scores[endId] || 0;
      const card = document.createElement('button');
      card.className = `ending-card ending-${e.color}`;
      card.innerHTML = `
        <div class="ending-card-title">${this.esc(e.title)}</div>
        <div class="ending-card-eyebrow">${this.esc(e.eyebrow)}</div>
        <div class="ending-score">Path weight: ${sc}</div>`;
      card.addEventListener('click', () => this.playEnding(endId));
      this.els.endingsGrid.appendChild(card);
    });
  },

  playEnding(endId) {
    const e = ENDINGS[endId];
    const rep = this.state.reputation;
    this.els.endEyebrow.textContent = e.eyebrow;
    this.els.endTitle.textContent = e.title;
    this.els.endBody.textContent = e.body;
    this.els.endEpilogue.textContent = e.epilogue;
    this.els.endStats.innerHTML = `
      <div class="end-stat"><div class="end-stat-val" style="color:var(--white-hat)">${rep.white > 0 ? '+' : ''}${rep.white}</div><div class="end-stat-label">White Hats</div></div>
      <div class="end-stat"><div class="end-stat-val" style="color:var(--gray-hat)">${rep.gray > 0 ? '+' : ''}${rep.gray}</div><div class="end-stat-label">Gray Hats</div></div>
      <div class="end-stat"><div class="end-stat-val" style="color:var(--black-hat)">${rep.black > 0 ? '+' : ''}${rep.black}</div><div class="end-stat-label">Black Hats</div></div>`;
    this.showView('end');
    document.body.classList.remove('ghost-rising');
  }
};
