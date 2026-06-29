/* ===== THE HATS — engine / state ===== */

const Game = {
  state: {
    handle: '',
    classId: null,
    player: null,       // { hp, maxHp, energy, maxEnergy, atk, def, int, statuses: [] }
    reputation: { white: 0, gray: 0, black: 0 },
    combat: null,       // active combat session, see combat.js
    flags: {}
  },

  init() {
    this.cacheEls();
    this.bindGlobalHandlers();
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
      sceneLog: document.getElementById('scene-log'),
      sceneChoices: document.getElementById('scene-choices'),
      combatField: document.getElementById('combat-field'),
      combatLog: document.getElementById('combat-log'),
      combatControls: document.getElementById('combat-controls'),
      nullspaceText: document.getElementById('nullspace-text'),
      endTitle: document.getElementById('end-title'),
      endBody: document.getElementById('end-body'),
      endStats: document.getElementById('end-stats'),
      btnRestart: document.getElementById('btn-restart')
    };
  },

  bindGlobalHandlers() {
    this.els.btnNewGame.addEventListener('click', () => this.goToCharCreate());
    this.els.btnConfirmClass.addEventListener('click', () => this.confirmClassAndStart());
    this.els.handleInput.addEventListener('input', () => this.validateCharCreate());
    this.els.btnRestart.addEventListener('click', () => location.reload());
    this.els.bootEnter.addEventListener('click', () => this.showView('title'));
  },

  showView(name) {
    this.els.views.forEach(v => v.classList.remove('view-active'));
    document.getElementById('view-' + name).classList.add('view-active');
  },

  // ---------- BOOT ----------
  runBoot() {
    this.els.bootAscii.textContent = BOOT_ASCII;
    let i = 0;
    const renderNext = () => {
      if (i >= BOOT_LINES.length) {
        this.els.bootEnter.classList.add('is-visible');
        return;
      }
      const line = BOOT_LINES[i];
      const div = document.createElement('div');
      div.className = 'boot-line';
      div.style.animationDelay = '0s';
      div.innerHTML = '<span class="' + (line.cls || '') + '">' + (line.cls === 'ok' ? '[ok] ' : line.cls === 'warn' ? '[!] ' : '> ') + this.escape(line.text) + '</span>';
      this.els.bootLines.appendChild(div);
      i++;
      setTimeout(renderNext, 220);
    };
    renderNext();
  },

  // ---------- CHARACTER CREATION ----------
  goToCharCreate() {
    this.renderClassGrid();
    this.showView('charcreate');
  },

  renderClassGrid() {
    this.els.classGrid.innerHTML = '';
    Object.values(CLASSES).forEach(cls => {
      const card = document.createElement('button');
      card.className = 'class-card';
      card.setAttribute('data-class', cls.id);
      card.innerHTML = `
        <div class="class-card-name">${this.escape(cls.name)}</div>
        <div class="class-card-tag">${this.escape(cls.tag)}</div>
        <div class="class-card-desc">${this.escape(cls.desc)}</div>
        <div class="class-card-stats">
          <span class="stat-pip">HP ${cls.baseHP}</span>
          <span class="stat-pip">EN ${cls.baseEnergy}</span>
          <span class="stat-pip">ATK ${cls.statline.atk}</span>
          <span class="stat-pip">DEF ${cls.statline.def}</span>
          <span class="stat-pip">INT ${cls.statline.int}</span>
        </div>
      `;
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
    const handle = this.els.handleInput.value.trim();
    this.els.btnConfirmClass.disabled = !(handle.length > 0 && this.state.classId);
  },

  confirmClassAndStart() {
    this.state.handle = this.els.handleInput.value.trim() || 'unknown';
    const cls = CLASSES[this.state.classId];
    this.state.player = {
      name: this.state.handle,
      classId: cls.id,
      className: cls.name,
      hp: cls.baseHP, maxHp: cls.baseHP,
      energy: cls.baseEnergy, maxEnergy: cls.baseEnergy,
      atk: cls.statline.atk, def: cls.statline.def, int: cls.statline.int,
      abilities: cls.abilities.slice(),
      statuses: []
    };
    this.goToHub();
  },

  // ---------- HUD (shared between hub + combat) ----------
  renderHud() {
    const p = this.state.player;
    const rep = this.state.reputation;
    const repBar = (key, label, colorVar) => {
      const val = rep[key];
      const pct = Math.max(0, Math.min(100, 50 + val * 2));
      return `
        <div class="hud-rep-row">
          <span class="hud-rep-name">${label}</span>
          <div class="hud-rep-track"><div class="hud-rep-fill" style="width:${pct}%;background:var(${colorVar})"></div></div>
        </div>
      `;
    };
    this.els.hud.innerHTML = `
      <div class="hud-handle">${this.escape(p.name)}</div>
      <div class="hud-class">${this.escape(p.className)}</div>
      <div class="hud-bar-row">
        <div class="hud-bar-label"><span>HP</span><span>${p.hp}/${p.maxHp}</span></div>
        <div class="hud-bar-track"><div class="hud-bar-fill hp" style="width:${(p.hp/p.maxHp)*100}%"></div></div>
      </div>
      <div class="hud-bar-row">
        <div class="hud-bar-label"><span>Energy</span><span>${p.energy}/${p.maxEnergy}</span></div>
        <div class="hud-bar-track"><div class="hud-bar-fill energy" style="width:${(p.energy/p.maxEnergy)*100}%"></div></div>
      </div>
      <div class="hud-rep-title">Faction standing</div>
      ${repBar('white', 'White Hats', '--white-hat')}
      ${repBar('gray', 'Gray Hats', '--gray-hat')}
      ${repBar('black', 'Black Hats', '--black-hat')}
    `;
  },

  // ---------- HUB / DIALOGUE ----------
  goToHub() {
    this.renderHud();
    this.showView('hub');
    this.els.sceneLog.innerHTML = '';
    this.runSceneNode(OPENING_SCENE.start);
  },

  runSceneNode(nodeId) {
    if (!nodeId) return;
    const node = OPENING_SCENE.nodes[nodeId];
    this.els.sceneChoices.innerHTML = '';
    let delay = 0;
    node.lines.forEach(line => {
      setTimeout(() => this.appendSceneLine(line), delay);
      delay += 550;
    });
    setTimeout(() => {
      if (node.choices) {
        this.renderChoices(node.choices);
      } else if (node.next) {
        this.runSceneNode(node.next);
      }
    }, delay + 150);
  },

  appendSceneLine(line) {
    const div = document.createElement('div');
    div.className = 'scene-line';
    const speakerCls = line.speaker === 'narration' ? 'narration' : line.speaker;
    const speakerLabel = line.name || (line.speaker === 'narration' ? '' : line.speaker);
    div.innerHTML = `
      ${speakerLabel ? `<div class="scene-speaker ${speakerCls}">${this.escape(speakerLabel)}</div>` : ''}
      <div class="scene-text ${line.speaker === 'narration' ? 'narration' : ''}">${this.escape(line.text)}</div>
    `;
    this.els.sceneLog.appendChild(div);
    this.els.sceneLog.parentElement.scrollTop = this.els.sceneLog.parentElement.scrollHeight;
  },

  renderChoices(choices) {
    this.els.sceneChoices.innerHTML = '';
    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `
        ${choice.tag ? `<span class="choice-tag ${choice.tag}">${choice.tag}</span>` : ''}
        <span>${this.escape(choice.label)}</span>
      `;
      btn.addEventListener('click', () => this.handleChoice(choice));
      this.els.sceneChoices.appendChild(btn);
    });
  },

  handleChoice(choice) {
    if (choice.rep) {
      Object.keys(choice.rep).forEach(k => {
        this.state.reputation[k] = (this.state.reputation[k] || 0) + choice.rep[k];
      });
      this.renderHud();
    }
    this.els.sceneChoices.innerHTML = '';
    if (choice.action === 'start-combat') {
      setTimeout(() => Combat.startEncounter(['swarmDrone', 'swarmDrone2', 'rogueSentry']), 300);
      return;
    }
    if (choice.next) this.runSceneNode(choice.next);
  },

  // ---------- NULLSPACE TRANSITION ----------
  playNullspaceTeaser(onDone) {
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
      delay += 1300;
    });
    setTimeout(() => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary nullspace-continue';
      btn.textContent = 'Continue';
      btn.addEventListener('click', () => {
        document.body.classList.remove('ghost-rising');
        onDone();
      });
      this.els.nullspaceText.appendChild(btn);
    }, delay + 400);
  },

  // ---------- END ----------
  goToEnd() {
    this.showView('end');
    this.els.endTitle.textContent = SLICE_END.title;
    this.els.endBody.textContent = SLICE_END.body;
    const rep = this.state.reputation;
    const leader = Object.keys(rep).reduce((a, b) => rep[a] >= rep[b] ? a : b);
    const leaderName = FACTIONS[leader].name;
    this.els.endStats.innerHTML = `
      <div class="end-stat"><div class="end-stat-val" style="color:var(--white-hat)">${rep.white}</div><div class="end-stat-label">White</div></div>
      <div class="end-stat"><div class="end-stat-val" style="color:var(--gray-hat)">${rep.gray}</div><div class="end-stat-label">Gray</div></div>
      <div class="end-stat"><div class="end-stat-val" style="color:var(--black-hat)">${rep.black}</div><div class="end-stat-label">Black</div></div>
    `;
    const note = document.createElement('p');
    note.style.color = 'var(--text-faint)';
    note.style.fontSize = '12px';
    note.style.marginTop = '-16px';
    note.textContent = `Leaning toward: ${leaderName}`;
    this.els.endStats.after(note);
  },

  // ---------- utils ----------
  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
