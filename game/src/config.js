// MONSTERWEAVE: TACTICAL BLOCK ONSLAUGHT — Configuration & Palette Constants

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

export const BEST_SCORE_KEY = 'monsterweave_best_score';
export const INITIAL_LIVES = 4;

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
export const SANCTUM_GATE_Y = 640;

// 3 Tactical Lanes on the battle path
export const LANES = [
  ARENA_X + 110, // Lane 0
  ARENA_X + 290, // Lane 1
  ARENA_X + 470, // Lane 2
];

// Rich Block Blast Gem Palette
export const GEM_TYPES = [
  { id: 'ruby', name: 'Ruby Salvo', color: '#ff3366', glow: 'rgba(255, 51, 102, 0.6)', light: '#ff99bb', dark: '#b3003b' },
  { id: 'sapphire', name: 'Frost Shard', color: '#00d2ff', glow: 'rgba(0, 210, 255, 0.6)', light: '#99f0ff', dark: '#007799' },
  { id: 'topaz', name: 'Storm Conduit', color: '#ffcc00', glow: 'rgba(255, 204, 0, 0.6)', light: '#fffa99', dark: '#997700' },
  { id: 'emerald', name: 'Verdant Barrier', color: '#00ff88', glow: 'rgba(0, 255, 136, 0.6)', light: '#99ffcc', dark: '#008844' },
  { id: 'amethyst', name: 'Void Lance', color: '#b84dff', glow: 'rgba(184, 77, 255, 0.6)', light: '#e6b3ff', dark: '#5c0099' }
];

// Monster Types
export const MONSTER_TYPES = {
  BEETLE: {
    id: 'beetle',
    name: 'Grave Beetle',
    maxHp: 60,
    speed: 55,
    score: 150,
    radius: 18,
    color: '#e65c00',
    aura: 'rgba(230, 92, 0, 0.4)'
  },
  GARGOYLE: {
    id: 'gargoyle',
    name: 'Dusk Gargoyle',
    maxHp: 140,
    speed: 40,
    score: 350,
    radius: 24,
    color: '#9933ff',
    aura: 'rgba(153, 51, 255, 0.5)'
  },
  GOLEM: {
    id: 'golem',
    name: 'Iron Golem',
    maxHp: 380,
    speed: 25,
    score: 800,
    radius: 32,
    color: '#3399ff',
    aura: 'rgba(51, 153, 255, 0.5)'
  },
  TITAN: {
    id: 'titan',
    name: 'The Dread Titan',
    maxHp: 1800,
    speed: 16,
    score: 5000,
    radius: 54,
    isBoss: true,
    color: '#ff1a1a',
    aura: 'rgba(255, 26, 26, 0.7)'
  }
};

// Difficulties
export const DIFFICULTIES = [
  { id: 'casual', label: 'CASUAL', spawnMultiplier: 0.8, hpMultiplier: 0.8 },
  { id: 'standard', label: 'STANDARD', spawnMultiplier: 1.0, hpMultiplier: 1.0 },
  { id: 'nightmare', label: 'NIGHTMARE', spawnMultiplier: 1.4, hpMultiplier: 1.3 }
];
