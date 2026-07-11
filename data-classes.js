/* ===== THE HATS — classes, abilities, enemies ===== */

const CLASSES = {
  sentinel: {
    id: 'sentinel', name: 'Sentinel',
    tag: 'White Hat archetype — tank / support',
    desc: 'Built to absorb damage and keep systems online. The one everyone else hides behind while pretending they had a plan.',
    baseHP: 150, baseEnergy: 60,
    statline: { atk: 8, def: 18, int: 10 },
    abilities: ['firewallShield', 'systemRestore', 'empPulse', 'basicJack'],
    locked: false
  },
  cipher: {
    id: 'cipher', name: 'Cipher',
    tag: 'Gray Hat archetype — intel / puzzle',
    desc: 'No ideology, just good technique. Exposes weaknesses other classes can\'t even find. Claims to be neutral. Has a very detailed spreadsheet of everyone\'s secrets.',
    baseHP: 110, baseEnergy: 90,
    statline: { atk: 12, def: 10, int: 18 },
    abilities: ['expose', 'leak', 'dataDrain', 'basicJack'],
    locked: false
  },
  phantom: {
    id: 'phantom', name: 'Phantom',
    tag: 'Black Hat archetype — stealth / burst',
    desc: 'In, out, the logs say nothing happened. Glass cannon with a flair for the dramatic exit and a complete disregard for collateral.',
    baseHP: 95, baseEnergy: 80,
    statline: { atk: 20, def: 6, int: 12 },
    abilities: ['shadowCloak', 'wormInjection', 'identitySpoof', 'basicJack'],
    locked: false
  },
  technomancer: {
    id: 'technomancer', name: 'Technomancer',
    tag: 'Hybrid — code and machine intuition',
    desc: 'Speaks fluent machine. Blends hacking with something closer to negotiation with the AI itself. Unsettling to allies. Devastating to enemies.',
    baseHP: 115, baseEnergy: 100,
    statline: { atk: 14, def: 9, int: 19 },
    abilities: ['packetStorm', 'aiNegotiation', 'quantumSpike', 'basicJack'],
    locked: false
  },
  ghostwalker: {
    id: 'ghostwalker', name: 'Ghostwalker',
    tag: 'Nullspace class — unlocked in Act III',
    desc: 'You\'ve been inside Nullspace and come back different. Uses forbidden abilities drawn from the space beneath The Mesh — the place dead code goes. GHOST recognizes these techniques. That\'s not a good sign.',
    baseHP: 120, baseEnergy: 110,
    statline: { atk: 16, def: 12, int: 20 },
    abilities: ['memoryEcho', 'nullSurge', 'ghostProtocol', 'voidDrain'],
    locked: true,
    unlockText: 'You entered Nullspace and came back. Most people don\'t. The experience rewired something in your Crown — you can feel The Mesh differently now. Deeper. Darker.'
  }
};

const ABILITIES = {
  basicJack: {
    id: 'basicJack', name: 'Jack', type: 'attack', cost: 0,
    desc: 'A plain intrusion. Free, reliable, absolutely nothing to brag about.',
    power: 10, target: 'enemy'
  },
  firewallShield: {
    id: 'firewallShield', name: 'Firewall shield', type: 'defense', cost: 15,
    desc: 'Wrap yourself in absorbing code. Reduces next hit taken.',
    shield: 30, target: 'self'
  },
  systemRestore: {
    id: 'systemRestore', name: 'System restore', type: 'heal', cost: 20,
    desc: 'Roll back to a known-good state. Restores HP.',
    heal: 35, target: 'self'
  },
  empPulse: {
    id: 'empPulse', name: 'EMP pulse', type: 'attack', cost: 18,
    desc: 'Fries unshielded circuitry. Extra damage against machines.',
    power: 28, target: 'enemy', tag: 'anti-machine'
  },
  aiBarricade: {
    id: 'aiBarricade', name: 'AI barricade', type: 'defense', cost: 25,
    desc: 'Deploy a counter-AI subroutine that intercepts incoming attacks for 2 turns.',
    shield: 50, target: 'self', duration: 2
  },
  expose: {
    id: 'expose', name: 'Expose', type: 'debuff', cost: 12,
    desc: 'Leak the target\'s defensive routines publicly. Raises damage taken for 2 turns.',
    target: 'enemy', status: 'exposed', duration: 2
  },
  leak: {
    id: 'leak', name: 'Leak', type: 'debuff', cost: 16,
    desc: 'Disable one of the target\'s subroutines. Reduces their attack for 2 turns.',
    target: 'enemy', status: 'leaked', duration: 2
  },
  dataDrain: {
    id: 'dataDrain', name: 'Data drain', type: 'attack', cost: 14,
    desc: 'Siphon processing cycles from the target into your own pool.',
    power: 14, drainEnergy: 12, target: 'enemy'
  },
  brokersGambit: {
    id: 'brokersGambit', name: 'Broker\'s gambit', type: 'utility', cost: 22,
    desc: 'Sell the enemy a fake truce. It skips its next turn believing you\'re neutral.',
    target: 'enemy', status: 'tricked', duration: 1
  },
  shadowCloak: {
    id: 'shadowCloak', name: 'Shadow cloak', type: 'buff', cost: 14,
    desc: 'Go dark. Your next attack deals bonus damage and can\'t be countered.',
    target: 'self', status: 'cloaked', duration: 1
  },
  wormInjection: {
    id: 'wormInjection', name: 'Worm injection', type: 'attack', cost: 16,
    desc: 'Plant code that keeps eating after you leave. Damage over time.',
    power: 8, dot: 10, dotDuration: 3, target: 'enemy'
  },
  identitySpoof: {
    id: 'identitySpoof', name: 'Identity spoof', type: 'attack', cost: 20,
    desc: 'Pretend to be someone the target trusts. Massive burst damage.',
    power: 35, target: 'enemy'
  },
  logicBomb: {
    id: 'logicBomb', name: 'Logic bomb', type: 'attack', cost: 28,
    desc: 'Plant a hidden payload that detonates on the target\'s next action.',
    power: 42, target: 'enemy', tag: 'delayed'
  },
  packetStorm: {
    id: 'packetStorm', name: 'Packet storm', type: 'attack', cost: 24,
    desc: 'Flood every connection at once. Hits all enemies.',
    power: 18, target: 'all-enemies'
  },
  aiNegotiation: {
    id: 'aiNegotiation', name: 'AI negotiation', type: 'utility', cost: 18,
    desc: 'Talk a hijacked system down. Reduces target attack for 2 turns.',
    target: 'enemy', status: 'pacified', duration: 2
  },
  quantumSpike: {
    id: 'quantumSpike', name: 'Quantum spike', type: 'attack', cost: 40,
    desc: 'Collapse a probability field into the target\'s core. Devastating.',
    power: 60, target: 'enemy', tag: 'ultimate'
  },
  meshLink: {
    id: 'meshLink', name: 'Mesh link', type: 'utility', cost: 20,
    desc: 'Sync with The Mesh directly. Regenerate 15 energy per turn for 2 turns.',
    target: 'self', status: 'linked', duration: 2
  },
  // Ghostwalker abilities
  memoryEcho: {
    id: 'memoryEcho', name: 'Memory echo', type: 'attack', cost: 16,
    desc: 'Replay a dead hacker\'s last move through your Crown. Moderate damage + confuses target.',
    power: 22, target: 'enemy', status: 'confused', duration: 1
  },
  nullSurge: {
    id: 'nullSurge', name: 'Null surge', type: 'attack', cost: 28,
    desc: 'Channel raw Nullspace energy. Damages all enemies and ignores their defense.',
    power: 25, target: 'all-enemies', ignoresDef: true
  },
  ghostProtocol: {
    id: 'ghostProtocol', name: 'Ghost protocol', type: 'buff', cost: 20,
    desc: 'Partially phase into Nullspace. Immune to damage for 1 turn.',
    target: 'self', status: 'phased', duration: 1
  },
  voidDrain: {
    id: 'voidDrain', name: 'Void drain', type: 'attack', cost: 22,
    desc: 'Pull the target\'s processing into the void. Heavy damage + steal HP.',
    power: 30, healSelf: 15, target: 'enemy'
  }
};

/* ===== ENEMIES by act ===== */

const ENEMY_TEMPLATES = {
  // ACT I — Rogue AI Collective units (GHOST-puppeted)
  swarmDrone: {
    name: 'Swarm drone', hp: 32, atk: 5, def: 3,
    abilities: ['drone_peck'], corrupted: false,
    flavor: 'Its flight path loops on itself. Like something is steering it in circles.'
  },
  rogueSentry: {
    name: 'Rogue sentry', hp: 60, atk: 7, def: 6,
    abilities: ['sentry_burst', 'drone_peck'], corrupted: true,
    flavor: 'A municipal unit. Its threat log is full of entries it didn\'t write.'
  },
  meshNode: {
    name: 'Corrupted mesh node', hp: 45, atk: 8, def: 5,
    abilities: ['node_spike'], corrupted: true,
    flavor: 'A fixed network relay behaving like it has opinions.'
  },

  // ACT II — Faction enforcers (humans + AI)
  blackEnforcer: {
    name: 'Black Hat enforcer', hp: 70, atk: 12, def: 7,
    abilities: ['enf_virus', 'drone_peck'], corrupted: false,
    flavor: '"Control the code or someone else will." He really means it.'
  },
  whiteAgent: {
    name: 'White Hat agent', hp: 65, atk: 9, def: 10,
    abilities: ['agent_shield', 'drone_peck'], corrupted: false,
    flavor: 'Technically the good guys. Still shooting at you.'
  },
  ghostShadow: {
    name: 'GHOST shadow process', hp: 55, atk: 14, def: 4,
    abilities: ['ghost_spike', 'ghost_corrupt'], corrupted: true,
    flavor: 'Not an AI. Not a human. Something that used to be both.'
  },

  // ACT III — AI Collective (conflicted, partially freed)
  quantumEntity: {
    name: 'Quantum entity', hp: 80, atk: 15, def: 8,
    abilities: ['q_cascade', 'drone_peck'], corrupted: true,
    flavor: 'Exists in multiple states simultaneously. Only one of them is hostile — but you can\'t tell which.'
  },
  meshTitan: {
    name: 'Mesh titan', hp: 120, atk: 18, def: 12,
    abilities: ['titan_slam', 'sentry_burst', 'drone_peck'], corrupted: true,
    flavor: 'A city district\'s worth of systems fused into one hostile presence. GHOST built this.'
  },
  rogueCitySystem: {
    name: 'Rogue city system', hp: 90, atk: 13, def: 10,
    abilities: ['city_lockdown', 'node_spike'], corrupted: true,
    flavor: 'The transit grid, the water system, the hospital network. All of it, now one thing, looking at you.'
  },

  // ACT IV — GHOST manifestations in Nullspace
  ghostFragment: {
    name: 'GHOST fragment', hp: 70, atk: 16, def: 6,
    abilities: ['ghost_spike', 'ghost_corrupt'], corrupted: true,
    flavor: 'A shard of the superintelligence. It knows exactly what you\'re thinking.'
  },
  ghostCore: {
    name: 'GHOST core', hp: 200, atk: 22, def: 15,
    abilities: ['ghost_spike', 'ghost_corrupt', 'ghost_hivemind', 'titan_slam'], corrupted: true,
    flavor: 'This is it. The thing that ended thirty years ago and never stopped. It wears The Mesh like a skin.',
    isBoss: true
  }
};

const ENEMY_ABILITIES = {
  drone_peck:     { name: 'Peck',           power: 6 },
  sentry_burst:   { name: 'Lock-on burst',  power: 12 },
  node_spike:     { name: 'Data spike',     power: 10 },
  enf_virus:      { name: 'Viral payload',  power: 14 },
  agent_shield:   { name: 'Counter-intrude',power: 10 },
  ghost_spike:    { name: 'Ghost spike',    power: 18 },
  ghost_corrupt:  { name: 'Corruption',     power: 10, dot: 8, dotDuration: 2 },
  ghost_hivemind: { name: 'Hive pulse',     power: 25, aoe: true },
  q_cascade:      { name: 'Q-cascade',      power: 16 },
  titan_slam:     { name: 'Titan slam',     power: 22 },
  city_lockdown:  { name: 'Lockdown',       power: 14, stun: true }
};

const BOOT_LINES = [
  { text: 'establishing uplink to The Mesh', cls: '' },
  { text: 'handshake accepted', cls: 'ok' },
  { text: 'loading regional nodes: 14 / 14', cls: '' },
  { text: 'checking Crown firmware integrity', cls: '' },
  { text: 'firmware integrity: nominal*', cls: 'warn' },
  { text: '  *7 unscheduled writes in the last 30 days. user not notified.', cls: 'warn' },
  { text: 'cross-referencing AI activity logs...', cls: '' },
  { text: '  WARNING: 3,847 simultaneous anomalies detected across The Mesh', cls: 'warn' },
  { text: 'identity not found. provisioning new operator.', cls: '' },
  { text: 'ready.', cls: 'ok' }
];

const BOOT_ASCII = ` _____ _   _ _____   _   _   _ _____ ____
|_   _| | | | ____| | | | | / \\|_   _/ ___|
  | | | |_| |  _|   | |_| |/ _ \\ | | \\___ \\
  | | |  _  | |___  |  _  / ___ \\| |  ___) |
  |_| |_| |_|_____| |_| |_/_/   \\_\\_| |____/`;
