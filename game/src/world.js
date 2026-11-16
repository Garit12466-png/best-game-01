// MONSTERWEAVE — Game World State, Wave Progression, Combat Coordination & Line Blasts

import {
  ARENA_X, ARENA_WIDTH, SANCTUM_GATE_Y,
  GRID_COLS, GRID_ROWS, GRID_CELL_SIZE, GRID_GAP, GRID_ORIGIN_X, GRID_ORIGIN_Y,
  INITIAL_LIVES, DIFFICULTIES
} from './config.js';
import {
  createEmptyGrid, generatePieceTray, canPlaceShape, placeShapeOnGrid,
  findCompletedLines, clearLinesFromGrid, hasPossibleMove
} from './blocks.js';
import { createMonster, updateMonster, applyMonsterDamage, generateWaveQueue } from './monsters.js';
import { ParticleSystem } from './particles.js';
import {
  playPlaceSound, playBlastSound, playSalvoSound, playExplosionSound,
  playHitSound, playDamageSound
} from './audio.js';

export function createWorld(rng) {
  const particles = new ParticleSystem();
  const grid = createEmptyGrid();
  const tray = generatePieceTray(rng);

  return {
    rng,
    particles,
    grid,
    tray,
    monsters: [],
    waveQueue: [],
    wave: 1,
    waveTimer: 0,
    waveStarted: false,
    lives: INITIAL_LIVES,
    score: 0,
    combo: 1,
    comboTimer: 0,
    energy: 100,
    difficultyIndex: 1, // Standard by default
    isGameOver: false,
    isVictory: false,
    stats: {
      monstersSlain: 0,
      linesBlasted: 0,
      maxCombo: 1,
      totalDamageDealt: 0,
      wavesCleared: 0
    },

    reset(difficultyIdx = 1) {
      this.difficultyIndex = difficultyIdx;
      this.grid = createEmptyGrid();
      this.tray = generatePieceTray(this.rng);
      this.monsters = [];
      this.waveQueue = [];
      this.wave = 1;
      this.waveTimer = 0;
      this.waveStarted = false;
      this.lives = INITIAL_LIVES;
      this.score = 0;
      this.combo = 1;
      this.comboTimer = 0;
      this.energy = 100;
      this.isGameOver = false;
      this.isVictory = false;
      this.stats = {
        monstersSlain: 0,
        linesBlasted: 0,
        maxCombo: 1,
        totalDamageDealt: 0,
        wavesCleared: 0
      };
      this.startWave(1);
    },

    startWave(waveNum) {
      this.wave = waveNum;
      const diff = DIFFICULTIES[this.difficultyIndex];
      this.waveQueue = generateWaveQueue(waveNum, diff.spawnMultiplier);
      this.waveTimer = 0;
      this.waveStarted = true;
      this.particles.addFloatingText(
        ARENA_X + ARENA_WIDTH / 2,
        250,
        `--- WAVE ${waveNum} BEGINS ---`,
        '#ffcc00',
        28,
        true
      );
    },

    step(dt) {
      this.particles.update(dt);

      if (this.isGameOver || this.isVictory) return;

      // Handle combo timeout
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 1;
        }
      }

      // Wave spawning
      if (this.waveStarted) {
        this.waveTimer += dt;
        for (let i = this.waveQueue.length - 1; i >= 0; i--) {
          const item = this.waveQueue[i];
          if (this.waveTimer >= item.delay) {
            this.monsters.push(createMonster(item.type, item.lane, this.wave));
            this.waveQueue.splice(i, 1);
          }
        }
      }

      // Update active monsters
      for (let i = this.monsters.length - 1; i >= 0; i--) {
        const m = this.monsters[i];
        updateMonster(m, dt);

        // Monster reached Sanctum Gate
        if (m.breached) {
          this.lives -= (m.isBoss ? 2 : 1);
          this.particles.addShake(m.isBoss ? 16 : 8);
          this.particles.spawnExplosion(m.x, SANCTUM_GATE_Y, '#ff2222', 30, 200);
          this.particles.addFloatingText(m.x, SANCTUM_GATE_Y - 30, '-1 LIFE!', '#ff3333', 26, true);
          playDamageSound();
          this.monsters.splice(i, 1);

          if (this.lives <= 0) {
            this.lives = 0;
            this.isGameOver = true;
            return;
          }
        }
      }

      // Check wave completion
      if (this.waveStarted && this.waveQueue.length === 0 && this.monsters.length === 0) {
        this.stats.wavesCleared++;
        this.score += 1500 * this.wave;
        this.particles.addFloatingText(
          ARENA_X + ARENA_WIDTH / 2,
          280,
          `WAVE ${this.wave} PURIFIED! +${1500 * this.wave}`,
          '#00ff88',
          30,
          true
        );

        if (this.wave >= 10) {
          // Victory after completing Wave 10!
          this.isVictory = true;
        } else {
          // Next wave
          this.startWave(this.wave + 1);
        }
      }
    },

    placePiece(trayIndex, gridCol, gridRow) {
      if (this.isGameOver || this.isVictory) return false;
      const piece = this.tray[trayIndex];
      if (!piece || piece.placed) return false;

      if (!canPlaceShape(this.grid, piece.shape, gridCol, gridRow)) {
        return false;
      }

      // Place shape
      const placedCells = placeShapeOnGrid(this.grid, piece.shape, gridCol, gridRow, piece.gemType);
      piece.placed = true;
      playPlaceSound();

      // Spawn subtle placement sparks
      placedCells.forEach(cell => {
        const x = GRID_ORIGIN_X + cell.col * (GRID_CELL_SIZE + GRID_GAP) + GRID_CELL_SIZE / 2;
        const y = GRID_ORIGIN_Y + cell.row * (GRID_CELL_SIZE + GRID_GAP) + GRID_CELL_SIZE / 2;
        this.particles.spawnPlacementSparks(x, y, piece.gemType.color);
      });

      this.score += piece.rows * piece.cols * 15;

      // Check for line clears
      const completed = findCompletedLines(this.grid);
      const totalLines = completed.rows.length + completed.cols.length;

      if (totalLines > 0) {
        this.executeLineBlast(completed, piece.gemType);
      }

      // Check if all tray pieces used; generate new tray
      if (this.tray.every(p => p.placed)) {
        this.tray = generatePieceTray(this.rng);
      }

      // Check if grid is jammed and no move left
      if (!hasPossibleMove(this.grid, this.tray)) {
        this.isGameOver = true;
        this.particles.addFloatingText(
          GRID_ORIGIN_X + 200,
          GRID_ORIGIN_Y + 200,
          'GRID LOCKED — NO MOVES!',
          '#ff3333',
          32,
          true
        );
      }

      return true;
    },

    executeLineBlast(completed, activeGemType) {
      const totalLines = completed.rows.length + completed.cols.length;
      this.combo++;
      this.comboTimer = 6.0;
      if (this.combo > this.stats.maxCombo) {
        this.stats.maxCombo = this.combo;
      }

      this.stats.linesBlasted += totalLines;
      const baseLineScore = totalLines * 300 * this.combo;
      this.score += baseLineScore;

      playBlastSound(this.combo);
      playSalvoSound();
      this.particles.addShake(totalLines * 4.5);

      // Clear blocks
      const clearedGems = clearLinesFromGrid(this.grid, completed);

      // Line blast visual & salvo launch
      clearedGems.forEach(cg => {
        const gemX = GRID_ORIGIN_X + cg.col * (GRID_CELL_SIZE + GRID_GAP) + GRID_CELL_SIZE / 2;
        const gemY = GRID_ORIGIN_Y + cg.row * (GRID_CELL_SIZE + GRID_GAP) + GRID_CELL_SIZE / 2;
        this.particles.spawnExplosion(gemX, gemY, cg.gem.gemType.color, 8, 120);
      });

      // Target monsters with beam salvo
      const blastDamage = 120 * totalLines * (1 + (this.combo - 1) * 0.35);

      if (this.monsters.length > 0) {
        // Find priority targets (closest to Sanctum Gate)
        const sortedMonsters = [...this.monsters].sort((a, b) => b.y - a.y);
        const targetCount = Math.min(sortedMonsters.length, totalLines * 2 + 1);

        for (let i = 0; i < targetCount; i++) {
          const target = sortedMonsters[i];
          const beamStartX = GRID_ORIGIN_X - 10;
          const beamStartY = GRID_ORIGIN_Y + Math.random() * (GRID_ROWS * (GRID_CELL_SIZE + GRID_GAP));

          this.particles.spawnLaserBeam(beamStartX, beamStartY, target.x, target.y, activeGemType.color);

          const isCrit = Math.random() < 0.25;
          const finalDamage = Math.round(isCrit ? blastDamage * 1.75 : blastDamage);
          this.stats.totalDamageDealt += finalDamage;

          const killed = applyMonsterDamage(target, finalDamage, activeGemType.id);
          playHitSound();

          this.particles.addFloatingText(
            target.x,
            target.y - 15,
            isCrit ? `CRIT! ${finalDamage}` : `${finalDamage}`,
            isCrit ? '#ffcc00' : activeGemType.light,
            isCrit ? 24 : 18,
            isCrit
          );

          if (killed) {
            this.stats.monstersSlain++;
            this.score += target.score * this.combo;
            this.energy += target.isBoss ? 250 : 25;
            this.particles.spawnExplosion(target.x, target.y, target.color, target.isBoss ? 60 : 25, 220);
            playExplosionSound();
          }
        }

        // Clean dead monsters
        this.monsters = this.monsters.filter(m => !m.dead);
      }

      // Combo announcement
      if (totalLines > 1 || this.combo > 2) {
        this.particles.addFloatingText(
          GRID_ORIGIN_X + 200,
          GRID_ORIGIN_Y - 20,
          `${totalLines >= 3 ? 'TRIPLE BLAST!' : totalLines === 2 ? 'DOUBLE BLAST!' : 'COMBO'} x${this.combo}! +${baseLineScore}`,
          '#ff3366',
          26,
          true
        );
      }
    }
  };
}
