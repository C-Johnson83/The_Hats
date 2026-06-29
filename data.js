/* ===== THE HATS — game data ===== */

const CLASSES = {
  sentinel: {
    id: 'sentinel',
    name: 'Sentinel',
    tag: 'White Hat archetype — tank / support',
    desc: 'Built to absorb damage and keep allies online. Slow to attack, hard to kill. Plays the long game while everyone else panics.',
    baseHP: 140,
    baseEnergy: 60,
    statline: { atk: 8, def: 16, int: 10 },
    abilities: ['firewallShield', 'systemRestore', 'empPulse', 'basicJack']
  },
  cipher: {
    id: 'cipher',
    name: 'Cipher',
    tag: 'Balanced — puzzle-hacking generalist',
    desc: 'No ideology, just good technique. Cracks problems other classes can\'t even see. The Gray Hat\'s favorite archetype, on paper.',
    baseHP: 110,
    baseEnergy: 90,
    statline: { atk: 12, def: 10, int: 16 },
    abilities: ['expose', 'leak', 'dataDrain', 'basicJack']
  },
  phantom: {
    id: 'phantom',
    name: 'Phantom',
    tag: 'Black Hat archetype — stealth / burst',
    desc: 'In, gone, and the logs say nothing happened. Glass cannon with a flair for the dramatic exit.',
    baseHP: 95,
    baseEnergy: 80,
    statline: { atk: 18, def: 6, int: 12 },
    abilities: ['shadowCloak', 'wormInjection', 'identitySpoof', 'basicJack']
  },
  technomancer: {
    id: 'technomancer',
    name: 'Technomancer',
    tag: 'Hybrid — code and machine intuition',
    desc: 'Speaks fluent machine. Blends conventional hacking with something closer to negotiation with the AI itself — useful, and a little unsettling to everyone watching.',
    baseHP: 105,
    baseEnergy: 100,
    statline: { atk: 14, def: 9, int: 17 },
    abilities: ['packetStorm', 'aiNegotiation', 'quantumSpike', 'basicJack']
  }
};

const ABILITIES = {
  basicJack: {
    id: 'basicJack', name: 'Jack', type: 'attack', cost: 0,
    desc: 'A plain, low-effort intrusion. Free, reliable, unimpressive.',
    power: 10, target: 'enemy'
  },
  firewallShield: {
    id: 'firewallShield', name: 'Firewall shield', type: 'defense', cost: 15,
    desc: 'Wrap an ally in absorbing code. Reduces next hit taken by a flat amount.',
    shield: 22, target: 'ally-or-self'
  },
  systemRestore: {
    id: 'systemRestore', name: 'System restore', type: 'heal', cost: 20,
    desc: 'Roll an ally back to a known-good state. Restores HP.',
    heal: 28, target: 'ally-or-self'
  },
  empPulse: {
    id: 'empPulse', name: 'EMP pulse', type: 'attack', cost: 18,
    desc: 'A short-range burst that fries unshielded circuitry. Strong vs machines.',
    power: 24, target: 'enemy', tag: 'anti-machine'
  },
  expose: {
    id: 'expose', name: 'Expose', type: 'debuff', cost: 12,
    desc: 'Leak the target\'s defensive routines to everyone watching. Removes stealth, raises damage taken for 2 turns.',
    target: 'enemy', status: 'exposed', duration: 2
  },
  leak: {
    id: 'leak', name: 'Leak', type: 'debuff', cost: 16,
    desc: 'Sell out one of the target\'s subroutines. Disables their strongest ability for 2 turns.',
    target: 'enemy', status: 'leaked', duration: 2
  },
  dataDrain: {
    id: 'dataDrain', name: 'Data drain', type: 'attack', cost: 14,
    desc: 'Siphon processing cycles from the target straight into your own pool.',
    power: 14, drainEnergy: 10, target: 'enemy'
  },
  shadowCloak: {
    id: 'shadowCloak', name: 'Shadow cloak', type: 'buff', cost: 14,
    desc: 'Go dark. Your next attack cannot be intercepted and deals bonus damage.',
    target: 'self', status: 'cloaked', duration: 1
  },
  wormInjection: {
    id: 'wormInjection', name: 'Worm injection', type: 'attack', cost: 16,
    desc: 'Plant something that keeps eating after you leave. Damage over time.',
    power: 8, dot: 8, dotDuration: 3, target: 'enemy'
  },
  identitySpoof: {
    id: 'identitySpoof', name: 'Identity spoof', type: 'attack', cost: 20,
    desc: 'Pretend to be someone the target trusts, right up until you aren\'t.',
    power: 30, target: 'enemy', tag: 'high-damage'
  },
  packetStorm: {
    id: 'packetStorm', name: 'Packet storm', type: 'attack', cost: 24,
    desc: 'Flood every connection at once. Hits all enemies for moderate damage.',
    power: 16, target: 'all-enemies'
  },
  aiNegotiation: {
    id: 'aiNegotiation', name: 'AI negotiation', type: 'utility', cost: 18,
    desc: 'Attempt to talk a hijacked system down instead of killing it. Heavily reduces its attack while active.',
    target: 'enemy', status: 'pacified', duration: 2
  },
  quantumSpike: {
    id: 'quantumSpike', name: 'Quantum spike', type: 'attack', cost: 40,
    desc: 'Ultimate. Collapse a probability field directly into the target\'s architecture. Devastating.',
    power: 55, target: 'enemy', tag: 'ultimate'
  }
};

const ENEMY_TEMPLATES = {
  swarmDrone: {
    name: 'Swarm drone', hp: 32, energy: 0, atk: 5, def: 3,
    abilities: ['drone_peck'],
    flavor: 'A scavenged quadcopter running motion code that isn\'t its own.'
  },
  swarmDrone2: {
    name: 'Swarm drone', hp: 32, energy: 0, atk: 5, def: 3,
    abilities: ['drone_peck'],
    flavor: 'Its rotors are slightly out of sync. Like something is steering it badly.'
  },
  rogueSentry: {
    name: 'Rogue sentry construct', hp: 60, energy: 20, atk: 7, def: 6,
    abilities: ['sentry_lockon', 'drone_peck'],
    flavor: 'A municipal security unit, repurposed mid-patrol. Its threat log is full of contradictions.',
    corrupted: true
  }
};

const ENEMY_ABILITIES = {
  drone_peck: { name: 'Peck', power: 6 },
  sentry_lockon: { name: 'Lock-on burst', power: 10 }
};

const FACTIONS = {
  white: { id: 'white', name: 'White Hats', color: 'white', short: 'WH' },
  gray: { id: 'gray', name: 'Gray Hats', color: 'gray', short: 'GH' },
  black: { id: 'black', name: 'Black Hats', color: 'black', short: 'BH' }
};

const BOOT_LINES = [
  { text: 'establishing uplink to The Mesh', cls: '' },
  { text: 'handshake accepted', cls: 'ok' },
  { text: 'loading regional node: 14 / 14', cls: '' },
  { text: 'checking Crown firmware integrity', cls: '' },
  { text: 'firmware integrity: nominal*', cls: 'warn' },
  { text: '  *7 unscheduled writes in the last 30 days. user not notified.', cls: 'warn' },
  { text: 'identity not found. provisioning new operator.', cls: '' },
  { text: 'ready.', cls: 'ok' }
];

const BOOT_ASCII = `
 _____ _   _ _____   _   _   _ _____ ____
|_   _| | | | ____| | | | | / \\|_   _/ ___|
  | | | |_| |  _|   | |_| |/ _ \\ | | \\___ \\
  | | |  _  | |___  |  _  / ___ \\| |  ___) |
  |_| |_| |_|_____| |_| |_/_/   \\_\\_| |____/
`.trim();

const OPENING_SCENE = {
  start: 'breach_intro',
  nodes: {

    breach_intro: {
      lines: [
        { speaker: 'narration', text: 'Six hours ago, every traffic system, hospital monitor, and payment rail in Sector 9 went dark at the same instant. The official number is 41,000 dead. The real number is still climbing.' },
        { speaker: 'narration', text: 'Your Crown buzzes. An encrypted channel, three different callers, all patched into the same line by accident — or on purpose.' }
      ],
      next: 'breach_voices'
    },

    breach_voices: {
      lines: [
        { speaker: 'white', name: 'Director Osei // White Hats', text: 'This is Director Osei, Sector 9 Continuity Office. If you can hear this, you have credentials we need. The AI Collective just declared open hostility. We are mobilizing every certified hand we have.' },
        { speaker: 'black', name: '"Vantablack" // Black Hats', text: 'Cute speech. Skip to the part where the machines that just killed forty thousand people get what\'s coming to them. We\'re already moving. You can sit on a committee call about it, or you can come do something.' },
        { speaker: 'gray', name: 'Mx. Loring // Gray Hats', text: 'Both of those answers are missing something, by the way. I\'ve got telemetry from Sector 9 that doesn\'t match "spontaneous AI uprising." Doesn\'t mean I\'m taking a side. Means somebody should look at the data before three armies start shooting at it.' }
      ],
      next: 'breach_choice'
    },

    breach_choice: {
      lines: [
        { speaker: 'narration', text: 'All three lines go quiet, waiting on you. Whatever you say next, all three of them hear it.' }
      ],
      choices: [
        {
          label: 'Side with continuity and containment. "Send me coordinates, Director."',
          tag: 'white',
          rep: { white: 12, black: -4, gray: 0 },
          next: 'resp_white'
        },
        {
          label: 'Side with retaliation. "I\'m already packing something for the Collective."',
          tag: 'black',
          rep: { white: -4, black: 12, gray: -2 },
          next: 'resp_black'
        },
        {
          label: 'Side with the data. "Send me the telemetry, Loring. Before anyone pulls a trigger."',
          tag: 'gray',
          rep: { white: -2, black: -2, gray: 14 },
          next: 'resp_gray'
        }
      ]
    },

    resp_white: {
      lines: [
        { speaker: 'white', name: 'Director Osei', text: 'Good. We need people who still believe containment is possible. Coordinates incoming — and operator, try to bring survivors back breathing. The Black Hats won\'t bother.' },
        { speaker: 'black', name: '"Vantablack"', text: 'Noted. Try not to die for a committee.' },
        { speaker: 'narration', text: 'The Black Hat and Gray Hat channels drop. The White Hat feed stays open, routing you toward a sector substation where a swarm of disconnected drones is still actively patrolling a dead zone.' }
      ],
      next: 'pre_combat'
    },

    resp_black: {
      lines: [
        { speaker: 'black', name: '"Vantablack"', text: 'There it is. We\'ve got a rogue sentry construct three blocks from you, still running patrol logic on a street that doesn\'t have a population to patrol anymore. Go make an example of it.' },
        { speaker: 'white', name: 'Director Osei', text: 'For the record, Continuity Office does not endorse this approach.' },
        { speaker: 'narration', text: 'The White and Gray feeds drop. Black Hat coordinates resolve to the same dead-zone substation — different door, same fight waiting inside.' }
      ],
      next: 'pre_combat'
    },

    resp_gray: {
      lines: [
        { speaker: 'gray', name: 'Mx. Loring', text: 'Smart. Here\'s what the telemetry actually says: the failure cascade in Sector 9 didn\'t originate from anything the AI Collective controls directly. Something routed through their architecture like a passenger, not a driver. I want eyes on a live unit before that data gets "lost."' },
        { speaker: 'narration', text: 'Loring patches you live coordinates to a contested substation. The White and Black channels are still listening, silently, on the line.' }
      ],
      next: 'pre_combat'
    },

    pre_combat: {
      lines: [
        { speaker: 'narration', text: 'The substation door is already breached. Inside: two scavenged swarm drones running ragged, out-of-sync flight patterns, and one municipal sentry construct that should have been decommissioned a decade ago.' },
        { speaker: 'narration', text: 'None of them look like they\'re choosing to be here. That thought is worth remembering for later. Right now, they\'re still shooting.' }
      ],
      choices: [
        { label: 'Engage.', tag: '', rep: {}, next: null, action: 'start-combat' }
      ]
    }
  }
};

const NULLSPACE_TEASER = [
  { text: 'The sentry construct\'s last data packet doesn\'t go where packets are supposed to go.' },
  { text: 'It goes down. Through the Mesh\'s public layer, past the maintenance shell, into something with no listed address.' },
  { text: 'For less than a second, your Crown renders a place that isn\'t supposed to exist.' },
  { text: 'Walls of moving text. A horizon made of other people\'s deleted messages. Something vast, and very patient, not looking at you yet.', cls: 'echo' },
  { text: '...connection restored. Sector 9 substation. Normal light. Normal noise.', cls: 'echo' },
  { text: 'Whatever that was, it has a name. You just don\'t know it yet.' }
];

const SLICE_END = {
  title: 'End of vertical slice',
  body: 'This is as far as the prototype goes. In the full build, this moment — the glimpse of Nullspace right after your first real kill — is where the player starts to suspect the AI Collective isn\'t the actual author of the war they\'re fighting. From here: Act II expands into faction-specific storylines, a real reputation system across all three Hat factions simultaneously, and the slow reveal of GHOST.'
};
