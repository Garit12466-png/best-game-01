// MONSTERWEAVE: TACTICAL BLOCK ONSLAUGHT — Configuration & Balanced Tuning

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

export const BEST_SCORE_KEY = 'monsterweave_best_score';
export const INITIAL_LIVES = 5;
export const INITIAL_SHIELD = 60;

// Grid layout: 8x8 Block Blast matrix on right side
export const GRID_COLS = 8;
export const GRID_ROWS = 8;
export const GRID_CELL_SIZE = 52;
export const GRID_GAP = 5;
export const GRID_ORIGIN_X = 660;
export const GRID_ORIGIN_Y = 120;

// Battlefield layout: Left side monster path
export const ARENA_X = 30;
export const ARENA_Y = 85;
export const ARENA_WIDTH = 580;
export const ARENA_HEIGHT = 605;
export const SANCTUM_GATE_Y = 620;

// 3 Tactical Lanes on the battle path
export const LANES = [
  ARENA_X + 110, // Lane 0 (West)
  ARENA_X + 290, // Lane 1 (Center)
  ARENA_X + 470  // Lane 2 (East)
];

// Rich Block Blast Gem Palette with Specular Shine & Glow
export const GEM_TYPES = [
  { id: 'ruby', name: 'Ruby Salvo', color: '#ff2d55', glow: 'rgba(255, 45, 85, 0.65)', light: '#ff859e', dark: '#990022', icon: '✦' },
  { id: 'sapphire', name: 'Frost Shard', color: '#00d2ff', glow: 'rgba(0, 210, 255, 0.65)', light: '#80e5ff', dark: '#005f7a', icon: '❄' },
  { id: 'topaz', name: 'Storm Conduit', color: '#ffb300', glow: 'rgba(255, 179, 0, 0.65)', light: '#ffe082', dark: '#996300', icon: '⚡' },
  { id: 'emerald', name: 'Verdant Barrier', color: '#00e676', glow: 'rgba(0, 230, 118, 0.65)', light: '#b9f6ca', dark: '#007038', icon: '🛡' },
  { id: 'amethyst', name: 'Void Lance', color: '#b347ff', glow: 'rgba(179, 71, 255, 0.65)', light: '#e1b3ff', dark: '#52008f', icon: '✹' }
];

// Balanced Monster Stats (The Golden Middle: engaging, responsive, fair)
export const MONSTER_TYPES = {
  BEETLE: {
    id: 'beetle',
    name: 'Grave Beetle',
    maxHp: 50,
    speed: 34,       // Golden middle speed
    score: 150,
    radius: 20,
    color: '#ff6600',
    aura: 'rgba(255, 102, 0, 0.4)'
  },
  GARGOYLE: {
    id: 'gargoyle',
    name: 'Dusk Gargoyle',
    maxHp: 125,
    speed: 28,       // Golden middle speed
    score: 350,
    radius: 26,
    color: '#a855f7',
    aura: 'rgba(168, 85, 247, 0.5)'
  },
  GOLEM: {
    id: 'golem',
    name: 'Runic Golem',
    maxHp: 320,
    speed: 20,       // Golden middle speed
    score: 800,
    radius: 34,
    color: '#38bdf8',
    aura: 'rgba(56, 189, 248, 0.5)'
  },
  TITAN: {
    id: 'titan',
    name: 'The Dread Titan',
    maxHp: 1400,     // Boss HP
    speed: 13,       // Menacing boss march
    score: 5000,
    radius: 54,
    isBoss: true,
    color: '#ef4444',
    aura: 'rgba(239, 68, 68, 0.75)'
  }
};

// Difficulties
export const DIFFICULTIES = [
  { id: 'casual', label: 'CASUAL', spawnMultiplier: 0.7, hpMultiplier: 0.7, speedMultiplier: 0.8 },
  { id: 'standard', label: 'STANDARD', spawnMultiplier: 1.0, hpMultiplier: 1.0, speedMultiplier: 1.0 },
  { id: 'nightmare', label: 'NIGHTMARE', spawnMultiplier: 1.3, hpMultiplier: 1.25, speedMultiplier: 1.2 }
];
