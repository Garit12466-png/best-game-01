// MONSTERWEAVE — Canvas 2D Renderer: Block Blast Aesthetics, Dark Fantasy Monsters & Tactical HUD

import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  ARENA_X, ARENA_Y, ARENA_WIDTH, ARENA_HEIGHT, SANCTUM_GATE_Y, LANES,
  GRID_COLS, GRID_ROWS, GRID_CELL_SIZE, GRID_GAP, GRID_ORIGIN_X, GRID_ORIGIN_Y,
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_VICTORY,
  DIFFICULTIES
} from './config.js';
import { canPlaceShape } from './blocks.js';
import { getAudioMuted } from './audio.js';

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(world, screenState, inputManager, bestScore = 0) {
    const ctx = this.ctx;
    const shake = world.particles.getShakeOffset();

    ctx.save();
    ctx.translate(shake.x, shake.y);

    // 1. Master Background
    this.drawBackground(ctx);

    // 2. Left Battlefield: The Dread Path
    this.drawBattlefield(ctx, world);

    // 3. Right Matrix: 8x8 Tactical Block Blast Grid
    this.drawBlockMatrix(ctx, world, inputManager);

    // 4. Tray of 3 Polyomino Pieces
    this.drawPieceTray(ctx, world, inputManager);

    // 5. Laser beams, particles, and floating damage numbers
    world.particles.draw(ctx);

    // 6. Top Header Bar & HUD
    this.drawHeaderHud(ctx, world, bestScore);

    // 7. Dragged Piece Overlay (draw directly under mouse cursor)
    if (inputManager && inputManager.draggedPieceIndex >= 0) {
      this.drawDraggedPiece(ctx, world, inputManager);
    }

    // 8. Screen Overlays (Title, Pause, Victory, Game Over)
    if (screenState === SCREEN_TITLE) {
      this.drawTitleScreen(ctx, world, bestScore);
    } else if (screenState === SCREEN_PAUSED) {
      this.drawPauseScreen(ctx);
    } else if (screenState === SCREEN_OVER) {
      this.drawEndScreen(ctx, world, false, bestScore);
    } else if (screenState === SCREEN_VICTORY) {
      this.drawEndScreen(ctx, world, true, bestScore);
    }

    ctx.restore();
  }

  drawBackground(ctx) {
    // Deep dark slate gradient
    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0c1017');
    bgGrad.addColorStop(0.5, '#090d12');
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle tactical grid background pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }

  drawBattlefield(ctx, world) {
    ctx.save();

    // Dark stone road container
    ctx.fillStyle = '#10141d';
    ctx.strokeStyle = '#1f2633';
    ctx.lineWidth = 2;
    this.roundRect(ctx, ARENA_X, ARENA_Y, ARENA_WIDTH, ARENA_HEIGHT, 12, true, true);

    // Decorative rune lane dividers
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.08)';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ARENA_X + 200, ARENA_Y + 10);
    ctx.lineTo(ARENA_X + 200, ARENA_Y + ARENA_HEIGHT - 10);
    ctx.moveTo(ARENA_X + 380, ARENA_Y + 10);
    ctx.lineTo(ARENA_X + 380, ARENA_Y + ARENA_HEIGHT - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Lane labels at top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LANE 1 (WEST)', LANES[0], ARENA_Y + 22);
    ctx.fillText('LANE 2 (CENTRAL)', LANES[1], ARENA_Y + 22);
    ctx.fillText('LANE 3 (EAST)', LANES[2], ARENA_Y + 22);

    // Sanctum Gate Barrier at the bottom
    const gateGrad = ctx.createLinearGradient(ARENA_X, SANCTUM_GATE_Y - 20, ARENA_X, SANCTUM_GATE_Y + 40);
    gateGrad.addColorStop(0, 'rgba(0, 210, 255, 0.0)');
    gateGrad.addColorStop(0.3, 'rgba(0, 210, 255, 0.25)');
    gateGrad.addColorStop(1, 'rgba(0, 150, 255, 0.6)');
    ctx.fillStyle = gateGrad;
    ctx.fillRect(ARENA_X + 2, SANCTUM_GATE_Y - 10, ARENA_WIDTH - 4, 55);

    // Glowing defense line
    ctx.strokeStyle = '#00d2ff';
    ctx.shadowColor = '#00d2ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ARENA_X + 4, SANCTUM_GATE_Y);
    ctx.lineTo(ARENA_X + ARENA_WIDTH - 4, SANCTUM_GATE_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Defense Turrets on gate
    LANES.forEach(lx => {
      ctx.fillStyle = '#00e1d9';
      ctx.beginPath();
      ctx.arc(lx, SANCTUM_GATE_Y + 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lx, SANCTUM_GATE_Y + 12, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ SANCTUM DEFENSE BARRIER ⚡', ARENA_X + ARENA_WIDTH / 2, SANCTUM_GATE_Y + 34);

    // Draw active monsters
    for (const m of world.monsters) {
      this.drawMonster(ctx, m);
    }

    ctx.restore();
  }

  drawMonster(ctx, m) {
    ctx.save();
    ctx.translate(m.x, m.y);

    // Aura glow
    ctx.fillStyle = m.aura;
    ctx.shadowColor = m.color;
    ctx.shadowBlur = m.isBoss ? 25 : 12;
    ctx.beginPath();
    ctx.arc(0, 0, m.radius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Flash hit effect
    const bodyColor = m.flashTimer > 0 ? '#ffffff' : m.color;

    if (m.type === 'beetle') {
      // Crawling Beetle: oval segmented carapace with pincers
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, m.radius, m.radius * 1.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pincers
      ctx.strokeStyle = '#ffa366';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-6, -m.radius * 1.2);
      ctx.lineTo(-12, -m.radius * 1.6);
      ctx.moveTo(6, -m.radius * 1.2);
      ctx.lineTo(12, -m.radius * 1.6);
      ctx.stroke();

      // Glowing eyes
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(-5, -m.radius * 0.7, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -m.radius * 0.7, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.type === 'gargoyle') {
      // Dusk Gargoyle: Winged silhouette
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(0, -m.radius * 1.3);
      ctx.lineTo(-m.radius * 1.5, m.radius * 0.5);
      ctx.lineTo(-m.radius * 0.5, m.radius * 0.2);
      ctx.lineTo(0, m.radius);
      ctx.lineTo(m.radius * 0.5, m.radius * 0.2);
      ctx.lineTo(m.radius * 1.5, m.radius * 0.5);
      ctx.closePath();
      ctx.fill();

      // Horns
      ctx.strokeStyle = '#d9b3ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-4, -m.radius * 1.1);
      ctx.lineTo(-8, -m.radius * 1.6);
      ctx.moveTo(4, -m.radius * 1.1);
      ctx.lineTo(8, -m.radius * 1.6);
      ctx.stroke();
    } else if (m.type === 'golem') {
      // Iron Golem: Chunky armored hexagon
      ctx.fillStyle = bodyColor;
      this.drawHexagon(ctx, 0, 0, m.radius);

      // Core visor glow
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(-m.radius * 0.6, -3, m.radius * 1.2, 6);
    } else if (m.type === 'titan') {
      // The Dread Titan (Boss): Massive horned titan
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
      ctx.fill();

      // Volcanic magma chest cracks
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-15, -10);
      ctx.lineTo(0, 15);
      ctx.lineTo(15, -10);
      ctx.stroke();

      // Enormous horned crowns
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-m.radius * 0.7, -m.radius * 0.5);
      ctx.lineTo(-m.radius * 1.3, -m.radius * 1.2);
      ctx.moveTo(m.radius * 0.7, -m.radius * 0.5);
      ctx.lineTo(m.radius * 1.3, -m.radius * 1.2);
      ctx.stroke();
    }

    ctx.restore();

    // Monster Health Bar
    const barWidth = m.isBoss ? 110 : 36;
    const barHeight = m.isBoss ? 8 : 4;
    const barX = m.x - barWidth / 2;
    const barY = m.y - m.radius - (m.isBoss ? 20 : 12);
    const hpRatio = Math.max(0, m.hp / m.maxHp);

    ctx.fillStyle = '#111111';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    const hpColor = hpRatio > 0.5 ? '#00ff88' : hpRatio > 0.25 ? '#ffcc00' : '#ff3333';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    if (m.isBoss) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${m.name}: ${m.hp}/${m.maxHp}`, m.x, barY - 5);
    }
  }

  drawHexagon(ctx, x, y, radius) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + radius * Math.cos(angle);
      const hy = y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
  }

  drawBlockMatrix(ctx, world, inputManager) {
    ctx.save();

    // Matrix container box
    const matrixW = GRID_COLS * (GRID_CELL_SIZE + GRID_GAP) + GRID_GAP;
    const matrixH = GRID_ROWS * (GRID_CELL_SIZE + GRID_GAP) + GRID_GAP;
    ctx.fillStyle = '#10141d';
    ctx.strokeStyle = '#1f2633';
    ctx.lineWidth = 2;
    this.roundRect(ctx, GRID_ORIGIN_X - 15, GRID_ORIGIN_Y - 35, matrixW + 30, matrixH + 50, 14, true, true);

    // Matrix Header
    ctx.fillStyle = '#00d2ff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TACTICAL GEM MATRIX (8×8)', GRID_ORIGIN_X - 5, GRID_ORIGIN_Y - 14);

    if (world.combo > 1) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`⚡ COMBO STREAK x${world.combo}!`, GRID_ORIGIN_X + matrixW + 5, GRID_ORIGIN_Y - 14);
    }

    // Grid Slots & Gems
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cellX = GRID_ORIGIN_X + c * (GRID_CELL_SIZE + GRID_GAP);
        const cellY = GRID_ORIGIN_Y + r * (GRID_CELL_SIZE + GRID_GAP);

        // Sunken dark tile slot
        ctx.fillStyle = '#171c26';
        ctx.strokeStyle = '#222938';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, cellX, cellY, GRID_CELL_SIZE, GRID_CELL_SIZE, 8, true, true);

        // Placed Gem
        const cellData = world.grid[r][c];
        if (cellData) {
          this.drawGlossyGem(ctx, cellX, cellY, GRID_CELL_SIZE, cellData.gemType);
        }
      }
    }

    // Hover / Placement Ghost Highlight
    if (inputManager) {
      const activePieceIdx = inputManager.draggedPieceIndex >= 0
        ? inputManager.draggedPieceIndex
        : inputManager.selectedPieceIndex;

      if (activePieceIdx >= 0 && activePieceIdx < world.tray.length) {
        const piece = world.tray[activePieceIdx];
        if (piece && !piece.placed) {
          const hovered = this.getGridCoordsFromMouse(inputManager.mouse.x, inputManager.mouse.y);
          if (hovered) {
            const canFit = canPlaceShape(world.grid, piece.shape, hovered.col, hovered.row);
            this.drawPlacementGhost(ctx, piece, hovered.col, hovered.row, canFit);
          }
        }
      }
    }

    ctx.restore();
  }

  drawPlacementGhost(ctx, piece, startCol, startRow, canFit) {
    ctx.save();
    ctx.fillStyle = canFit ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 51, 51, 0.4)';
    ctx.strokeStyle = canFit ? '#00ff88' : '#ff3333';
    ctx.lineWidth = 2;

    for (let r = 0; r < piece.rows; r++) {
      for (let c = 0; c < piece.cols; c++) {
        if (piece.shape[r][c] === 1) {
          const gridCol = startCol + c;
          const gridRow = startRow + r;
          if (gridCol < GRID_COLS && gridRow < GRID_ROWS) {
            const x = GRID_ORIGIN_X + gridCol * (GRID_CELL_SIZE + GRID_GAP);
            const y = GRID_ORIGIN_Y + gridRow * (GRID_CELL_SIZE + GRID_GAP);
            this.roundRect(ctx, x, y, GRID_CELL_SIZE, GRID_CELL_SIZE, 8, true, true);
          }
        }
      }
    }
    ctx.restore();
  }

  drawGlossyGem(ctx, x, y, size, gemType) {
    ctx.save();

    // Outer soft glow
    ctx.shadowColor = gemType.glow;
    ctx.shadowBlur = 10;

    // Base Gem Body Gradient
    const grad = ctx.createLinearGradient(x, y, x, y + size);
    grad.addColorStop(0, gemType.light);
    grad.addColorStop(0.35, gemType.color);
    grad.addColorStop(1, gemType.dark);
    ctx.fillStyle = grad;
    this.roundRect(ctx, x, y, size, size, 8, true, false);

    // Glossy top glass highlight
    const highlight = ctx.createLinearGradient(x, y, x, y + size * 0.45);
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = highlight;
    this.roundRect(ctx, x + 3, y + 2, size - 6, size * 0.42, 6, true, false);

    // Inner subtle jewel facet border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x + 2, y + 2, size - 4, size - 4, 6, false, true);

    ctx.restore();
  }

  drawPieceTray(ctx, world, inputManager) {
    ctx.save();

    const trayY = 585;
    const slotW = 145;
    const slotH = 105;
    const gap = 15;
    const trayStartX = GRID_ORIGIN_X - 10;

    for (let i = 0; i < 3; i++) {
      const piece = world.tray[i];
      const slotX = trayStartX + i * (slotW + gap);

      // Slot Background card
      const isSelected = inputManager && inputManager.selectedPieceIndex === i;
      ctx.fillStyle = isSelected ? 'rgba(0, 210, 255, 0.12)' : '#10141d';
      ctx.strokeStyle = isSelected ? '#00d2ff' : '#1f2633';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      this.roundRect(ctx, slotX, trayY, slotW, slotH, 10, true, true);

      // Card number badge [1], [2], [3]
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`[${i + 1}]`, slotX + 8, trayY + 16);

      // Draw Piece inside slot if not placed and not currently being dragged
      if (piece && !piece.placed && (!inputManager || inputManager.draggedPieceIndex !== i)) {
        const cellSize = 22;
        const pieceW = piece.cols * cellSize;
        const pieceH = piece.rows * cellSize;
        const offsetX = slotX + (slotW - pieceW) / 2;
        const offsetY = trayY + (slotH - pieceH) / 2 + 6;

        for (let r = 0; r < piece.rows; r++) {
          for (let c = 0; c < piece.cols; c++) {
            if (piece.shape[r][c] === 1) {
              const px = offsetX + c * cellSize;
              const py = offsetY + r * cellSize;
              this.drawGlossyGem(ctx, px, py, cellSize - 2, piece.gemType);
            }
          }
        }
      }
    }

    ctx.restore();
  }

  drawDraggedPiece(ctx, world, inputManager) {
    const piece = world.tray[inputManager.draggedPieceIndex];
    if (!piece || piece.placed) return;

    ctx.save();
    const cellSize = GRID_CELL_SIZE;
    const mx = inputManager.mouse.x - (piece.cols * cellSize) / 2;
    const my = inputManager.mouse.y - (piece.rows * cellSize) / 2;

    for (let r = 0; r < piece.rows; r++) {
      for (let c = 0; c < piece.cols; c++) {
        if (piece.shape[r][c] === 1) {
          const px = mx + c * (cellSize + GRID_GAP);
          const py = my + r * (cellSize + GRID_GAP);
          this.drawGlossyGem(ctx, px, py, cellSize, piece.gemType);
        }
      }
    }
    ctx.restore();
  }

  drawHeaderHud(ctx, world, bestScore) {
    ctx.save();

    // Top Header Background Ribbon
    ctx.fillStyle = '#0a0d13';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 68);
    ctx.strokeStyle = '#1b2330';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 68);
    ctx.lineTo(CANVAS_WIDTH, 68);
    ctx.stroke();

    // Left: Hearts / Sanctum Gate Lives
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SANCTUM CORE:', 25, 40);

    for (let i = 0; i < 4; i++) {
      ctx.font = '24px sans-serif';
      if (i < world.lives) {
        ctx.fillStyle = '#ff2a5f';
        ctx.shadowColor = '#ff2a5f';
        ctx.shadowBlur = 8;
        ctx.fillText('♥', 165 + i * 28, 43);
      } else {
        ctx.fillStyle = '#3a4454';
        ctx.shadowBlur = 0;
        ctx.fillText('♡', 165 + i * 28, 43);
      }
    }
    ctx.shadowBlur = 0;

    // Center: Wave Tracker & Difficulty
    const diff = DIFFICULTIES[world.difficultyIndex];
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${world.wave}`, CANVAS_WIDTH / 2 - 40, 32);

    ctx.fillStyle = '#8b9bb4';
    ctx.font = '12px sans-serif';
    ctx.fillText(`MODE: ${diff.label}`, CANVAS_WIDTH / 2 - 40, 50);

    // Audio status icon [M: Audio]
    ctx.fillStyle = getAudioMuted() ? '#ff5555' : '#00d2ff';
    ctx.font = '12px sans-serif';
    ctx.fillText(getAudioMuted() ? '🔇 MUTED (M)' : '🔊 AUDIO (M)', CANVAS_WIDTH / 2 + 75, 40);

    // Right: Score, Best & Energy Shards
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8b9bb4';
    ctx.font = '11px sans-serif';
    ctx.fillText(`BEST: ${bestScore.toLocaleString()}`, CANVAS_WIDTH - 25, 26);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`SCORE: ${world.score.toLocaleString()}`, CANVAS_WIDTH - 25, 52);

    ctx.restore();
  }

  drawTitleScreen(ctx, world, bestScore) {
    ctx.save();

    // Dim backdrop
    ctx.fillStyle = 'rgba(5, 8, 12, 0.88)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title Card Box
    const boxW = 860;
    const boxH = 560;
    const boxX = (CANVAS_WIDTH - boxW) / 2;
    const boxY = (CANVAS_HEIGHT - boxH) / 2;

    ctx.fillStyle = '#0f141d';
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0, 210, 255, 0.4)';
    ctx.shadowBlur = 20;
    this.roundRect(ctx, boxX, boxY, boxW, boxH, 16, true, true);
    ctx.shadowBlur = 0;

    // Glowing Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px sans-serif';
    ctx.fillText('MONSTERWEAVE', CANVAS_WIDTH / 2, boxY + 70);

    ctx.fillStyle = '#00d2ff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('TACTICAL BLOCK ONSLAUGHT', CANVAS_WIDTH / 2, boxY + 105);

    // High Score Badge
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`🏆 ALL-TIME HIGH SCORE: ${bestScore.toLocaleString()} PTS`, CANVAS_WIDTH / 2, boxY + 145);

    // Strategic Concept Infographic Box
    const infoY = boxY + 175;
    ctx.fillStyle = '#161c28';
    ctx.strokeStyle = '#232d3f';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, boxX + 40, infoY, boxW - 80, 165, 12, true, true);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('⚔️ DUAL TACTICAL BATTLEFIELD ⚔️', CANVAS_WIDTH / 2, infoY + 30);

    ctx.fillStyle = '#8fa3bf';
    ctx.font = '14px sans-serif';
    ctx.fillText('1. Place polyomino gem blocks onto the 8×8 Matrix on the right.', CANVAS_WIDTH / 2, infoY + 60);
    ctx.fillText('2. Complete Rows & Columns to trigger elemental BLOCK BLASTS!', CANVAS_WIDTH / 2, infoY + 85);
    ctx.fillText('3. Each blast launches high-damage laser artillery into incoming monster swarms.', CANVAS_WIDTH / 2, infoY + 110);
    ctx.fillText('4. Defend your 4 Sanctum Hearts through 10 escalating waves & slay The Dread Titan!', CANVAS_WIDTH / 2, infoY + 135);

    // Difficulty Selectors
    const diffY = boxY + 370;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('SELECT DIFFICULTY:', CANVAS_WIDTH / 2, diffY);

    DIFFICULTIES.forEach((d, i) => {
      const btnX = CANVAS_WIDTH / 2 - 190 + i * 130;
      const isCur = world.difficultyIndex === i;
      ctx.fillStyle = isCur ? 'rgba(0, 210, 255, 0.25)' : '#161c28';
      ctx.strokeStyle = isCur ? '#00d2ff' : '#2a3547';
      ctx.lineWidth = isCur ? 2 : 1;
      this.roundRect(ctx, btnX, diffY + 12, 115, 36, 8, true, true);

      ctx.fillStyle = isCur ? '#00d2ff' : '#8fa3bf';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(d.label, btnX + 57, diffY + 35);
    });

    // Start Button
    const btnY = boxY + 465;
    const sGrad = ctx.createLinearGradient(0, btnY, 0, btnY + 54);
    sGrad.addColorStop(0, '#00e1d9');
    sGrad.addColorStop(1, '#008ba3');
    ctx.fillStyle = sGrad;
    ctx.shadowColor = '#00e1d9';
    ctx.shadowBlur = 18;
    this.roundRect(ctx, CANVAS_WIDTH / 2 - 180, btnY, 360, 54, 12, true, false);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('COMMENCE DEFENSE [CLICK / ENTER]', CANVAS_WIDTH / 2, btnY + 34);

    ctx.restore();
  }

  drawPauseScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 8, 12, 0.75)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = '#00d2ff';
    ctx.font = '18px sans-serif';
    ctx.fillText('PRESS [P] OR [SPACE] TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
    ctx.restore();
  }

  drawEndScreen(ctx, world, isVictory, bestScore) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 8, 12, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const boxW = 760;
    const boxH = 540;
    const boxX = (CANVAS_WIDTH - boxW) / 2;
    const boxY = (CANVAS_HEIGHT - boxH) / 2;

    ctx.fillStyle = '#0f141d';
    ctx.strokeStyle = isVictory ? '#00ff88' : '#ff3366';
    ctx.lineWidth = 3;
    ctx.shadowColor = isVictory ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 51, 102, 0.4)';
    ctx.shadowBlur = 25;
    this.roundRect(ctx, boxX, boxY, boxW, boxH, 16, true, true);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';
    ctx.fillStyle = isVictory ? '#00ff88' : '#ff3366';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(
      isVictory ? '🎉 SANCTUM PRESERVED — VICTORY! 🎉' : '💀 MISSION TERMINATED — SANCTUM BREACHED',
      CANVAS_WIDTH / 2,
      boxY + 65
    );

    // Final Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(`${world.score.toLocaleString()} PTS`, CANVAS_WIDTH / 2, boxY + 125);

    // Rating Badge (S-RANK / A-RANK / B-RANK)
    const rating = world.score > 60000 ? 'S-RANK' : world.score > 35000 ? 'A-RANK' : 'B-RANK';
    ctx.fillStyle = rating === 'S-RANK' ? '#ffcc00' : '#00d2ff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`DEFENSE RATING: ${rating}`, CANVAS_WIDTH / 2, boxY + 165);

    // Stats Table Grid
    const statY = boxY + 205;
    ctx.fillStyle = '#161c28';
    this.roundRect(ctx, boxX + 60, statY, boxW - 120, 190, 12, true, false);

    const statsList = [
      { label: 'WAVES COMPLETED:', val: `${world.stats.wavesCleared} / 10` },
      { label: 'MONSTERS SLAIN:', val: `${world.stats.monstersSlain}` },
      { label: 'LINES BLASTED:', val: `${world.stats.linesBlasted}` },
      { label: 'MAX COMBO STREAK:', val: `x${world.stats.maxCombo}` },
      { label: 'ALL-TIME HIGH SCORE:', val: `${Math.max(bestScore, world.score).toLocaleString()}` }
    ];

    statsList.forEach((s, idx) => {
      const sy = statY + 34 + idx * 32;
      ctx.fillStyle = '#8fa3bf';
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(s.label, boxX + 90, sy);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(s.val, boxX + boxW - 90, sy);
    });

    // Play Again Button
    const btnY = boxY + 440;
    const rGrad = ctx.createLinearGradient(0, btnY, 0, btnY + 54);
    rGrad.addColorStop(0, '#00d2ff');
    rGrad.addColorStop(1, '#006699');
    ctx.fillStyle = rGrad;
    ctx.shadowColor = '#00d2ff';
    ctx.shadowBlur = 15;
    this.roundRect(ctx, CANVAS_WIDTH / 2 - 160, btnY, 320, 54, 12, true, false);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('RESTART DEFENSE [R]', CANVAS_WIDTH / 2, btnY + 34);

    ctx.restore();
  }

  getGridCoordsFromMouse(mx, my) {
    if (
      mx < GRID_ORIGIN_X ||
      mx >= GRID_ORIGIN_X + GRID_COLS * (GRID_CELL_SIZE + GRID_GAP) ||
      my < GRID_ORIGIN_Y ||
      my >= GRID_ORIGIN_Y + GRID_ROWS * (GRID_CELL_SIZE + GRID_GAP)
    ) {
      return null;
    }
    const col = Math.floor((mx - GRID_ORIGIN_X) / (GRID_CELL_SIZE + GRID_GAP));
    const row = Math.floor((my - GRID_ORIGIN_Y) / (GRID_CELL_SIZE + GRID_GAP));
    return { col: Math.min(GRID_COLS - 1, Math.max(0, col)), row: Math.min(GRID_ROWS - 1, Math.max(0, row)) };
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
