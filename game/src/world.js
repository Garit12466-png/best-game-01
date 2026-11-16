// MONSTERWEAVE — Game World State, Wave Progression, Balanced Combat & Passive Darts

import {
  ARENA_X, ARENA_WIDTH, SANCTUM_GATE_Y, LANES,
  GRID_COLS, GRID_ROWS, GRID_CELL_SIZE, GRID_GAP, GRID_ORIGIN_X, GRID_ORIGIN_Y,
  INITIAL_LIVES, INITIAL_SHIELD, DIFFICULTIES
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
    shield: INITIAL_SHIELD,
    maxShield: INITIAL_SHIELD,
    score: 0,
    combo: 1,
    comboTimer: 0,
    energy: 100,
    difficultyIndex: 1, // Standard by default
    turretTimer: 0,
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
      this.shield = INITIAL_SHIELD;
      this.score = 0;
      this.combo = 1;
      this.comboTimer = 0;
      this.energy = 100;
      this.turretTimer = 0;
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
        240,
        `⚔️ WAVE ${waveNum} — COMMENCE DEFENSE ⚔️`,
        '#00d2ff',
        26,
        true
      );
    },

    step(dt) {
      this.particles.update(dt);

      if (this.isGameOver || this.isVictory) return;

      // Handle combo timeout (relaxed 8s timer)
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

      // Auto-turret defense: Sanctum gate zaps critical near monsters
      this.turretTimer += dt;
      if (this.turretTimer >= 1.5 && this.monsters.length > 0) {
        const dangerMonster = this.monsters.find(m => m.y >= SANCTUM_GATE_Y - 80 && !m.dead);
        if (dangerMonster) {
          this.turretTimer = 0;
          this.particles.spawnLaserBeam(dangerMonster.x, SANCTUM_GATE_Y, dangerMonster.x, dangerMonster.y, '#00d2ff');
          const killed = applyMonsterDamage(dangerMonster, 20);
          playHitSound();
          this.particles.addFloatingText(dangerMonster.x, dangerMonster.y - 10, 'ZAP! 20', '#00d2ff', 16, false);
          if (killed) {
            this.stats.monstersSlain++;
            this.score += dangerMonster.score;
            this.particles.spawnExplosion(dangerMonster.x, dangerMonster.y, dangerMonster.color, 18, 120);
          }
        }
      }

      // Update active monsters
      for (let i = this.monsters.length - 1; i >= 0; i--) {
        const m = this.monsters[i];
        updateMonster(m, dt);

        // Monster reached Sanctum Gate
        if (m.breached) {
          if (this.shield > 0) {
            // Shield absorbs damage first!
            const absorb = m.isBoss ? 60 : 35;
            this.shield = Math.max(0, this.shield - absorb);
            this.particles.addShake(6);
            this.particles.spawnExplosion(m.x, SANCTUM_GATE_Y, '#00d2ff', 20, 160);
            this.particles.addFloatingText(m.x, SANCTUM_GATE_Y - 30, `BARRIER ABSORBED! -${absorb}`, '#00d2ff', 20, true);
            playDamageSound();
          } else {
            // Lives damaged
            this.lives -= (m.isBoss ? 2 : 1);
            this.particles.addShake(m.isBoss ? 16 : 8);
            this.particles.spawnExplosion(m.x, SANCTUM_GATE_Y, '#ff2222', 30, 200);
            this.particles.addFloatingText(m.x, SANCTUM_GATE_Y - 30, '-1 HEART!', '#ff3333', 24, true);
            playDamageSound();

            if (this.lives <= 0) {
              this.lives = 0;
              this.isGameOver = true;
              return;
            }
          }
          this.monsters.splice(i, 1);
        }
      }

      // Clean dead monsters
      this.monsters = this.monsters.filter(m => !m.dead);

      // Check wave completion
      if (this.waveStarted && this.waveQueue.length === 0 && this.monsters.length === 0) {
        this.stats.wavesCleared++;
        const waveClearBonus = 1200 * this.wave;
        this.score += waveClearBonus;
        // Restore shield between waves
        this.shield = Math.min(this.maxShield, this.shield + 40);

        this.particles.addFloatingText(
          ARENA_X + ARENA_WIDTH / 2,
          260,
          `✨ WAVE ${this.wave} PURIFIED! +${waveClearBonus} ✨`,
          '#00ff88',
          28,
          true
        );

        if (this.wave >= 10) {
          this.isVictory = true;
        } else {
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

      // 1. Place shape on grid
      const placedCells = placeShapeOnGrid(this.grid, piece.shape, gridCol, gridRow, piece.gemType);
      piece.placed = true;
      playPlaceSound();

      // Spawn subtle placement sparks
      placedCells.forEach(cell => {
        const x = GRID_ORIGIN_X + cell.col * (GRID_CELL_SIZE + GRID_GAP) + GRID_CELL_SIZE / 2;
        const y = GRID_ORIGIN_Y + cell.row * (GRID_CELL_SIZE + GRID_GAP) + GRID_CELL_SIZE / 2;
        this.particles.spawnPlacementSparks(x, y, piece.gemType.color);
      });

      this.score += piece.rows * piece.cols * 20;

      // 2. PASSIVE GEM DARTS: Every placed piece actively shoots energy darts at monsters!
      if (this.monsters.length > 0) {
        const gemDamage = 8 * placedCells.length;
        // Target foremost monster (closest to gate)
        const target = [...this.monsters].sort((a, b) => b.y - a.y)[0];
        if (target) {
          const startX = GRID_ORIGIN_X;
          const startY = GRID_ORIGIN_Y + gridRow * (GRID_CELL_SIZE + GRID_GAP);
          this.particles.spawnLaserBeam(startX, startY, target.x, target.y, piece.gemType.color);

          const killed = applyMonsterDamage(target, gemDamage, piece.gemType.id);
          playHitSound();
          this.particles.addFloatingText(target.x, target.y - 12, `${gemDamage}`, piece.gemType.light, 16, false);

          if (killed) {
            this.stats.monstersSlain++;
            this.score += target.score;
            this.particles.spawnExplosion(target.x, target.y, target.color, target.isBoss ? 50 : 20, 180);
            playExplosionSound();
          }
        }
      }

      // Emerald perk: restores +10 barrier shield
      if (piece.gemType.id === 'emerald') {
        this.shield = Math.min(this.maxShield, this.shield + 12);
        this.particles.addFloatingText(GRID_ORIGIN_X + 200, GRID_ORIGIN_Y + 440, '+SHIELD REPAIR', '#00ff88', 15, false);
      }

      // 3. Check for line clears (The Big Block Blast!)
      const completed = findCompletedLines(this.grid);
      const totalLines = completed.rows.length + completed.cols.length;

      if (totalLines > 0) {
        this.executeLineBlast(completed, piece.gemType);
      }

      // Refill tray if all 3 placed
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
      this.comboTimer = 8.0;
      if (this.combo > this.stats.maxCombo) {
        this.stats.maxCombo = this.combo;
      }

      this.stats.linesBlasted += totalLines;
      const baseLineScore = totalLines * 500 * this.combo;
      this.score += baseLineScore;

      playBlastSound(this.combo);
      playSalvoSound();
      this.particles.addShake(totalLines * 5);

      // Clear blocks
      const clearedGems = clearLinesFromGrid(this.grid, completed);

      clearedGems.forEach(cg => {
        const gemX = GRID_ORIGIN_X + cg.col * (GRID_CELL_SIZE + GRID_GAP) + GRID_CELL_SIZE / 2;
        const gemY = GRID_ORIGIN_Y + cg.row * (GRID_CELL_SIZE + GRID_GAP) + GRID_CELL_SIZE / 2;
        this.particles.spawnExplosion(gemX, gemY, cg.gem.gemType.color, 10, 140);
      });

      // Target multiple monsters with heavy devastating salvo
      const blastDamage = 160 * totalLines * (1 + (this.combo - 1) * 0.4);

      if (this.monsters.length > 0) {
        const sortedMonsters = [...this.monsters].sort((a, b) => b.y - a.y);
        const targetCount = Math.min(sortedMonsters.length, totalLines * 3 + 1);

        for (let i = 0; i < targetCount; i++) {
          const target = sortedMonsters[i];
          const beamStartX = GRID_ORIGIN_X - 10;
          const beamStartY = GRID_ORIGIN_Y + Math.random() * (GRID_ROWS * (GRID_CELL_SIZE + GRID_GAP));

          this.particles.spawnLaserBeam(beamStartX, beamStartY, target.x, target.y, activeGemType.color);

          const isCrit = Math.random() < 0.35;
          const finalDamage = Math.round(isCrit ? blastDamage * 1.8 : blastDamage);
          this.stats.totalDamageDealt += finalDamage;

          const killed = applyMonsterDamage(target, finalDamage, activeGemType.id);
          playHitSound();

          this.particles.addFloatingText(
            target.x,
            target.y - 15,
            isCrit ? `CRIT! ${finalDamage}` : `${finalDamage}`,
            isCrit ? '#ffcc00' : activeGemType.light,
            isCrit ? 26 : 20,
            isCrit
          );

          if (killed) {
            this.stats.monstersSlain++;
            this.score += target.score * this.combo;
            this.particles.spawnExplosion(target.x, target.y, target.color, target.isBoss ? 70 : 30, 240);
            playExplosionSound();
          }
        }

        this.monsters = this.monsters.filter(m => !m.dead);
      }

      // Combo announcement
      if (totalLines > 1 || this.combo > 2) {
        this.particles.addFloatingText(
          GRID_ORIGIN_X + 200,
          GRID_ORIGIN_Y - 20,
          `${totalLines >= 3 ? 'TRIPLE BLAST!' : totalLines === 2 ? 'DOUBLE BLAST!' : 'COMBO'} x${this.combo}! +${baseLineScore}`,
          '#ff2d55',
          26,
          true
        );
      }
    }
  };
}
