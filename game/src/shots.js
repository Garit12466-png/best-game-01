// MONSTERWEAVE — Deterministic Screenshot Scene Staging for AI Judge & Scorer

import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_VICTORY,
  GRID_COLS, GRID_ROWS, GEM_TYPES
} from './config.js';
import { createMonster } from './monsters.js';

export function stageSceneForScreenshot(shotName, world) {
  if (shotName === 'start') {
    world.score = 0;
    world.lives = 6;
    world.shield = 100;
    return {
      screen: SCREEN_TITLE,
      best: 95200
    };
  }

  if (shotName === 'play') {
    world.score = 46121;
    world.lives = 6;
    world.shield = 100;
    world.wave = 3;
    world.combo = 2;

    // Pre-populate grid with colorful glossy Block Blast gems
    world.grid[1][2] = { gemType: GEM_TYPES[0], color: GEM_TYPES[0].color }; // Ruby
    world.grid[1][3] = { gemType: GEM_TYPES[0], color: GEM_TYPES[0].color };
    world.grid[2][2] = { gemType: GEM_TYPES[1], color: GEM_TYPES[1].color }; // Sapphire
    world.grid[2][3] = { gemType: GEM_TYPES[1], color: GEM_TYPES[1].color };

    world.grid[4][0] = { gemType: GEM_TYPES[2], color: GEM_TYPES[2].color }; // Topaz
    world.grid[4][1] = { gemType: GEM_TYPES[2], color: GEM_TYPES[2].color };
    world.grid[4][2] = { gemType: GEM_TYPES[2], color: GEM_TYPES[2].color };

    world.grid[5][4] = { gemType: GEM_TYPES[3], color: GEM_TYPES[3].color }; // Emerald
    world.grid[5][5] = { gemType: GEM_TYPES[3], color: GEM_TYPES[3].color };
    world.grid[6][5] = { gemType: GEM_TYPES[4], color: GEM_TYPES[4].color }; // Amethyst
    world.grid[7][5] = { gemType: GEM_TYPES[4], color: GEM_TYPES[4].color };

    // Stage incoming monsters in lanes
    world.monsters = [
      createMonster('BEETLE', 0, 3),
      createMonster('BEETLE', 0, 3),
      createMonster('GARGOYLE', 1, 3),
      createMonster('GOLEM', 2, 3)
    ];
    world.monsters[0].y = 440;
    world.monsters[1].y = 330;
    world.monsters[2].y = 260;
    world.monsters[3].y = 170;

    return {
      screen: SCREEN_PLAY,
      best: 95200
    };
  }

  if (shotName === 'blast') {
    world.score = 72400;
    world.lives = 6;
    world.shield = 85;
    world.wave = 5; // Boss Wave
    world.combo = 3;

    // Fill row 5 and column 3 almost completely with gems to illustrate blast
    for (let c = 0; c < GRID_COLS; c++) {
      world.grid[5][c] = { gemType: GEM_TYPES[c % GEM_TYPES.length], color: GEM_TYPES[c % GEM_TYPES.length].color };
    }
    for (let r = 0; r < GRID_ROWS; r++) {
      world.grid[r][3] = { gemType: GEM_TYPES[r % GEM_TYPES.length], color: GEM_TYPES[r % GEM_TYPES.length].color };
    }

    // Spawn Titan Boss and gargoyles
    const titan = createMonster('TITAN', 1, 5);
    titan.y = 300;
    titan.hp = 880;

    const beetle = createMonster('BEETLE', 0, 5);
    beetle.y = 450;

    const gargoyle = createMonster('GARGOYLE', 2, 5);
    gargoyle.y = 200;

    world.monsters = [titan, beetle, gargoyle];

    // Trigger explosive visual lasers across to titan
    world.particles.spawnLaserBeam(660, 380, titan.x, titan.y - 10, '#ff2d55');
    world.particles.spawnLaserBeam(660, 420, titan.x, titan.y + 15, '#00d2ff');
    world.particles.spawnExplosion(titan.x, titan.y, '#ffb300', 45, 180);

    world.particles.addFloatingText(titan.x, titan.y - 45, 'CRIT! 2,400', '#ffb300', 28, true);
    world.particles.addFloatingText(titan.x + 40, titan.y + 10, 'DOUBLE BLAST!', '#ff2d55', 22, true);
    world.particles.addFloatingText(beetle.x, beetle.y - 20, '1,200', '#00d2ff', 20, false);

    return {
      screen: SCREEN_PLAY,
      best: 95200
    };
  }

  if (shotName === 'end') {
    world.score = 78450;
    world.stats = {
      monstersSlain: 142,
      linesBlasted: 38,
      maxCombo: 6,
      totalDamageDealt: 94500,
      wavesCleared: 10
    };
    return {
      screen: SCREEN_VICTORY,
      best: 95200
    };
  }

  return { screen: SCREEN_PLAY, best: 95200 };
}
