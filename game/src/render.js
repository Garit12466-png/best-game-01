// MONSTERWEAVE — High-End Canvas 2D Renderer: Procedural Fantasy Sprites, Block Blast Jewel Facets & Atmospheric Visuals

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
    this.ambientTime = 0;
    this.embers = [];
    for (let i = 0; i < 35; i++) {
      this.embers.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        vy: -0.3 - Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.4,
        size: 1.2 + Math.random() * 2.2,
        alpha: 0.15 + Math.random() * 0.4,
        color: Math.random() > 0.4 ? '#ff9933' : '#00d2ff'
      });
    }
  }

  draw(world, screenState, inputManager, bestScore = 0) {
    const ctx = this.ctx;
    this.ambientTime += 0.025;
    const shake = world.particles.getShakeOffset();

    ctx.save();
    ctx.translate(shake.x, shake.y);

    // 1. Master Background & Ambient Embers
    this.drawBackground(ctx);

    // 2. Left Battlefield: The Dread Path & Monsters
    this.drawBattlefield(ctx, world);

    // 3. Right Matrix: 8x8 Tactical Jewel Grid
    this.drawBlockMatrix(ctx, world, inputManager);

    // 4. Tray of 3 Pieces
    this.drawPieceTray(ctx, world, inputManager);

    // 5. Beams, explosions, floating numbers
    world.particles.draw(ctx);

    // 6. Top Header HUD
    this.drawHeaderHud(ctx, world, bestScore);

    // 7. Dragged Piece Overlay
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
    // Rich dark fantasy slate gradient
    const bgGrad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 80,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.75
    );
    bgGrad.addColorStop(0, '#131924');
    bgGrad.addColorStop(0.6, '#0a0d14');
    bgGrad.addColorStop(1, '#040608');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle ambient grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Floating ambient embers
    for (const e of this.embers) {
      e.y += e.vy;
      e.x += e.vx + Math.sin(this.ambientTime + e.y * 0.01) * 0.2;
      if (e.y < -10) {
        e.y = CANVAS_HEIGHT + 10;
        e.x = Math.random() * CANVAS_WIDTH;
      }
      ctx.fillStyle = e.color;
      ctx.globalAlpha = e.alpha;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  drawBattlefield(ctx, world) {
    ctx.save();

    // Dark cobblestone fortress road
    const roadGrad = ctx.createLinearGradient(ARENA_X, ARENA_Y, ARENA_X + ARENA_WIDTH, ARENA_Y);
    roadGrad.addColorStop(0, '#111722');
    roadGrad.addColorStop(0.5, '#171e2c');
    roadGrad.addColorStop(1, '#111722');
    ctx.fillStyle = roadGrad;
    ctx.strokeStyle = '#273449';
    ctx.lineWidth = 3;
    this.roundRect(ctx, ARENA_X, ARENA_Y, ARENA_WIDTH, ARENA_HEIGHT, 14, true, true);

    // Stone block cobbles pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let y = ARENA_Y + 30; y < SANCTUM_GATE_Y; y += 45) {
      ctx.beginPath();
      ctx.moveTo(ARENA_X + 15, y);
      ctx.lineTo(ARENA_X + ARENA_WIDTH - 15, y);
      ctx.stroke();
    }

    // 3 Tactical Lane dividers with glowing arcane runes
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.12)';
    ctx.setLineDash([12, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ARENA_X + 195, ARENA_Y + 15);
    ctx.lineTo(ARENA_X + 195, SANCTUM_GATE_Y - 5);
    ctx.moveTo(ARENA_X + 385, ARENA_Y + 15);
    ctx.lineTo(ARENA_X + 385, SANCTUM_GATE_Y - 5);
    ctx.stroke();
    ctx.setLineDash([]);

    // Lane header plaques
    const laneNames = ['WEST APPROACH', 'ROYAL HIGHWAY', 'EAST APPROACH'];
    LANES.forEach((lx, i) => {
      ctx.fillStyle = 'rgba(0, 210, 255, 0.08)';
      this.roundRect(ctx, lx - 70, ARENA_Y + 8, 140, 22, 6, true, false);
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(laneNames[i], lx, ARENA_Y + 23);
    });

    // Flickering Torches on the battlefield walls
    const torchFlicker = Math.sin(this.ambientTime * 8) * 3;
    [ARENA_Y + 120, ARENA_Y + 280, ARENA_Y + 440].forEach(ty => {
      // Left Torch
      ctx.fillStyle = '#ff6600';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 14 + torchFlicker;
      ctx.beginPath();
      ctx.arc(ARENA_X + 8, ty, 5, 0, Math.PI * 2);
      ctx.fill();

      // Right Torch
      ctx.beginPath();
      ctx.arc(ARENA_X + ARENA_WIDTH - 8, ty, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Sanctum Castle Gate & Crystal Towers at bottom
    this.drawSanctumFortress(ctx, world);

    // Draw active animated monsters
    for (const m of world.monsters) {
      this.drawDetailedMonster(ctx, m);
    }

    ctx.restore();
  }

  drawSanctumFortress(ctx, world) {
    const gateY = SANCTUM_GATE_Y;

    // Glowing energy barrier dome
    const domePulse = Math.sin(this.ambientTime * 3) * 0.1;
    const domeGrad = ctx.createLinearGradient(ARENA_X, gateY - 20, ARENA_X, gateY + 50);
    domeGrad.addColorStop(0, `rgba(0, 210, 255, ${0.15 + domePulse})`);
    domeGrad.addColorStop(0.7, 'rgba(0, 150, 255, 0.35)');
    domeGrad.addColorStop(1, 'rgba(14, 116, 144, 0.85)');
    ctx.fillStyle = domeGrad;
    ctx.fillRect(ARENA_X + 3, gateY - 12, ARENA_WIDTH - 6, 68);

    // Glowing electric gate beam
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#00d2ff';
    ctx.shadowBlur = 16;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(ARENA_X + 6, gateY);
    ctx.lineTo(ARENA_X + ARENA_WIDTH - 6, gateY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Twin Crystal Defense Pylons on left and right
    [ARENA_X + 25, ARENA_X + ARENA_WIDTH - 25].forEach(px => {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      this.roundRect(ctx, px - 14, gateY - 8, 28, 48, 6, true, true);

      // Glowing floating crystal
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(px, gateY - 22 + Math.sin(this.ambientTime * 4) * 3);
      ctx.lineTo(px + 8, gateY - 12);
      ctx.lineTo(px, gateY - 2);
      ctx.lineTo(px - 8, gateY - 12);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Central Defense Badge & Shield Meter
    const shieldRatio = world.shield / world.maxShield;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    this.roundRect(ctx, ARENA_X + ARENA_WIDTH / 2 - 130, gateY + 12, 260, 24, 6, true, true);

    // Shield fill
    ctx.fillStyle = '#0284c7';
    this.roundRect(ctx, ARENA_X + ARENA_WIDTH / 2 - 128, gateY + 14, 256 * shieldRatio, 20, 4, true, false);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🛡️ SANCTUM BARRIER: ${Math.round(world.shield)} / ${world.maxShield}`, ARENA_X + ARENA_WIDTH / 2, gateY + 28);
  }

  drawDetailedMonster(ctx, m) {
    ctx.save();
    ctx.translate(m.x, m.y);

    // Ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, m.radius * 0.9, m.radius * 1.1, m.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flash hit effect
    const isFlashing = m.flashTimer > 0;

    if (m.type === 'beetle') {
      // 1. Grave Beetle: Spiked carapace, articulated legs, pincers
      const legCycle = Math.sin(m.animTimer * 2) * 5;

      // 6 Spidery Legs
      ctx.strokeStyle = isFlashing ? '#ffffff' : '#9a3412';
      ctx.lineWidth = 2.5;
      [-1, 1].forEach(side => {
        // Front leg
        ctx.beginPath();
        ctx.moveTo(side * 8, -6);
        ctx.lineTo(side * (m.radius + 6), -12 + legCycle);
        ctx.lineTo(side * (m.radius + 10), -4 + legCycle);
        ctx.stroke();

        // Mid leg
        ctx.beginPath();
        ctx.moveTo(side * 10, 2);
        ctx.lineTo(side * (m.radius + 8), 0 - legCycle);
        ctx.lineTo(side * (m.radius + 12), 10 - legCycle);
        ctx.stroke();

        // Back leg
        ctx.beginPath();
        ctx.moveTo(side * 8, 10);
        ctx.lineTo(side * (m.radius + 6), 16 + legCycle);
        ctx.lineTo(side * (m.radius + 10), 22 + legCycle);
        ctx.stroke();
      });

      // Carapace Body
      const bGrad = ctx.createRadialGradient(-3, -4, 2, 0, 0, m.radius);
      bGrad.addColorStop(0, isFlashing ? '#ffffff' : '#ea580c');
      bGrad.addColorStop(0.7, isFlashing ? '#ffffff' : '#c2410c');
      bGrad.addColorStop(1, isFlashing ? '#ffffff' : '#7c2d12');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, m.radius, m.radius * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing abdominal bioluminescent rune
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(0, 4, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Spiked Mandibles
      ctx.strokeStyle = '#fdba74';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-5, -m.radius);
      ctx.lineTo(-9, -m.radius - 8);
      ctx.lineTo(-4, -m.radius - 10);
      ctx.moveTo(5, -m.radius);
      ctx.lineTo(9, -m.radius - 8);
      ctx.lineTo(4, -m.radius - 10);
      ctx.stroke();

      // Glowing red eyes
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-5, -m.radius * 0.65, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -m.radius * 0.65, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (m.type === 'gargoyle') {
      // 2. Dusk Gargoyle: Animated spreading bat wings, stone horns
      const wingFlap = Math.sin(m.animTimer * 2.5) * 0.25;

      // Left & Right Bat Wings
      ctx.fillStyle = isFlashing ? '#ffffff' : '#7e22ce';
      ctx.strokeStyle = '#3b0764';
      ctx.lineWidth = 2;

      [-1, 1].forEach(dir => {
        ctx.save();
        ctx.scale(dir, 1);
        ctx.rotate(wingFlap);
        ctx.beginPath();
        ctx.moveTo(4, -6);
        ctx.lineTo(m.radius * 1.8, -m.radius * 1.2);
        ctx.lineTo(m.radius * 1.2, 4);
        ctx.lineTo(m.radius * 0.6, 2);
        ctx.lineTo(2, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      // Muscular Stone Torso
      ctx.fillStyle = isFlashing ? '#ffffff' : '#581c87';
      ctx.beginPath();
      ctx.ellipse(0, 2, m.radius * 0.75, m.radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Demonic Horns
      ctx.strokeStyle = '#d8b4fe';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-5, -m.radius * 0.7);
      ctx.lineTo(-11, -m.radius * 1.4);
      ctx.moveTo(5, -m.radius * 0.7);
      ctx.lineTo(11, -m.radius * 1.4);
      ctx.stroke();

      // Glowing violet eyes
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(-4, -m.radius * 0.4, 3, 0, Math.PI * 2);
      ctx.arc(4, -m.radius * 0.4, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (m.type === 'golem') {
      // 3. Runic Golem: Floating granite monolith boulders with electrical energy
      const gGrad = ctx.createLinearGradient(-m.radius, -m.radius, m.radius, m.radius);
      gGrad.addColorStop(0, isFlashing ? '#ffffff' : '#475569');
      gGrad.addColorStop(0.5, isFlashing ? '#ffffff' : '#334155');
      gGrad.addColorStop(1, isFlashing ? '#ffffff' : '#1e293b');
      ctx.fillStyle = gGrad;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;

      // Solid stone hexagon torso
      this.drawHexagon(ctx, 0, 0, m.radius);

      // Crackling Blue Runes in stone chest
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -m.radius * 0.6);
      ctx.lineTo(-m.radius * 0.4, 0);
      ctx.lineTo(0, m.radius * 0.6);
      ctx.lineTo(m.radius * 0.4, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Cyan visor slit
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(-m.radius * 0.5, -4, m.radius, 7);

    } else if (m.type === 'titan') {
      // 4. The Dread Titan (Boss): Enormous horned volcanic overlord
      ctx.fillStyle = isFlashing ? '#ffffff' : '#991b1b';
      ctx.beginPath();
      ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
      ctx.fill();

      // Magma cracks on obsidian body
      ctx.strokeStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-20, -15);
      ctx.lineTo(0, 20);
      ctx.lineTo(20, -15);
      ctx.moveTo(-15, 10);
      ctx.lineTo(15, 10);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Curved Demonic Obsidian Horns
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-m.radius * 0.6, -m.radius * 0.4);
      ctx.lineTo(-m.radius * 1.3, -m.radius * 1.2);
      ctx.lineTo(-m.radius * 0.9, -m.radius * 1.5);
      ctx.moveTo(m.radius * 0.6, -m.radius * 0.4);
      ctx.lineTo(m.radius * 1.3, -m.radius * 1.2);
      ctx.lineTo(m.radius * 0.9, -m.radius * 1.5);
      ctx.stroke();

      // Fiery glowing eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-14, -12, 5, 0, Math.PI * 2);
      ctx.arc(14, -12, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Monster Health Bar
    const barWidth = m.isBoss ? 130 : 42;
    const barHeight = m.isBoss ? 9 : 5;
    const barX = m.x - barWidth / 2;
    const barY = m.y - m.radius - (m.isBoss ? 26 : 14);
    const hpRatio = Math.max(0, m.hp / m.maxHp);

    // Frame
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    // Fill
    const hpColor = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    if (m.isBoss) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(`👑 ${m.name} [${m.hp} / ${m.maxHp}]`, m.x, barY - 6);
      ctx.shadowBlur = 0;
    }
  }

  drawHexagon(ctx, x, y, radius) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + radius * Math.cos(angle);
      const hy = y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawBlockMatrix(ctx, world, inputManager) {
    ctx.save();

    const matrixW = GRID_COLS * (GRID_CELL_SIZE + GRID_GAP) + GRID_GAP;
    const matrixH = GRID_ROWS * (GRID_CELL_SIZE + GRID_GAP) + GRID_GAP;

    // Outer Obsidian Frame with Chamfered Gold Rim
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    this.roundRect(ctx, GRID_ORIGIN_X - 16, GRID_ORIGIN_Y - 38, matrixW + 32, matrixH + 54, 16, true, true);

    // Matrix Title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💎 TACTICAL GEM MATRIX (8×8)', GRID_ORIGIN_X - 6, GRID_ORIGIN_Y - 16);

    if (world.combo > 1) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`⚡ COMBO STREAK x${world.combo}!`, GRID_ORIGIN_X + matrixW + 6, GRID_ORIGIN_Y - 16);
    }

    // Grid Slots & Placed Gems
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cellX = GRID_ORIGIN_X + c * (GRID_CELL_SIZE + GRID_GAP);
        const cellY = GRID_ORIGIN_Y + r * (GRID_CELL_SIZE + GRID_GAP);

        // Sunken beveled slot
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        this.roundRect(ctx, cellX, cellY, GRID_CELL_SIZE, GRID_CELL_SIZE, 8, true, true);

        // Placed Gem
        const cellData = world.grid[r][c];
        if (cellData) {
          this.drawVolumetricGem(ctx, cellX, cellY, GRID_CELL_SIZE, cellData.gemType);
        }
      }
    }

    // Hover Ghost Preview
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
    ctx.fillStyle = canFit ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)';
    ctx.strokeStyle = canFit ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2.5;

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

  drawVolumetricGem(ctx, x, y, size, gemType) {
    ctx.save();

    // Vibrant Glow
    ctx.shadowColor = gemType.glow;
    ctx.shadowBlur = 12;

    // Base Gem Body with High-Contrast Jewel Gradient
    const grad = ctx.createLinearGradient(x, y, x + size, y + size);
    grad.addColorStop(0, gemType.light);
    grad.addColorStop(0.35, gemType.color);
    grad.addColorStop(1, gemType.dark);
    ctx.fillStyle = grad;
    this.roundRect(ctx, x, y, size, size, 8, true, false);

    // Jewel Facet Bevel Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, x + 2, y + 2, size - 4, size - 4, 6, false, true);

    // Specular Glass Reflection on upper half
    const highlight = ctx.createLinearGradient(x, y, x, y + size * 0.48);
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    highlight.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = highlight;
    this.roundRect(ctx, x + 4, y + 3, size - 8, size * 0.42, 5, true, false);

    // Star Sparkle in top-left
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Central Rune / Elemental Icon
    if (gemType.icon) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = `bold ${Math.round(size * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gemType.icon, x + size / 2, y + size / 2 + 2);
    }

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
      const isSelected = inputManager && inputManager.selectedPieceIndex === i;

      // Card frame
      ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.18)' : '#0f172a';
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#334155';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      this.roundRect(ctx, slotX, trayY, slotW, slotH, 12, true, true);

      // Card index badge [1], [2], [3]
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`[${i + 1}]`, slotX + 8, trayY + 8);

      // Draw Piece inside slot if not placed and not dragged
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
              this.drawVolumetricGem(ctx, px, py, cellSize - 2, piece.gemType);
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
          this.drawVolumetricGem(ctx, px, py, cellSize, piece.gemType);
        }
      }
    }
    ctx.restore();
  }

  drawHeaderHud(ctx, world, bestScore) {
    ctx.save();

    // Dark sleek navigation ribbon
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 68);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 68);
    ctx.lineTo(CANVAS_WIDTH, 68);
    ctx.stroke();

    // Left: Hearts (6 Hearts)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SANCTUM:', 25, 34);

    for (let i = 0; i < 5; i++) {
      ctx.font = '24px sans-serif';
      if (i < world.lives) {
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 8;
        ctx.fillText('♥', 125 + i * 26, 36);
      } else {
        ctx.fillStyle = '#334155';
        ctx.shadowBlur = 0;
        ctx.fillText('♡', 125 + i * 26, 36);
      }
    }
    ctx.shadowBlur = 0;

    // Center: Wave & Difficulty
    const diff = DIFFICULTIES[world.difficultyIndex];
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${world.wave}`, CANVAS_WIDTH / 2 - 45, 26);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText(`MODE: ${diff.label}`, CANVAS_WIDTH / 2 - 45, 46);

    // Audio status icon [M]
    ctx.fillStyle = getAudioMuted() ? '#ef4444' : '#38bdf8';
    ctx.font = '12px sans-serif';
    ctx.fillText(getAudioMuted() ? '🔇 MUTED (M)' : '🔊 AUDIO (M)', CANVAS_WIDTH / 2 + 75, 36);

    // Right: Score & Best
    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText(`HIGH SCORE: ${bestScore.toLocaleString()}`, CANVAS_WIDTH - 25, 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`SCORE: ${world.score.toLocaleString()}`, CANVAS_WIDTH - 25, 48);

    ctx.restore();
  }

  drawTitleScreen(ctx, world, bestScore) {
    ctx.save();

    // Dim Backdrop
    ctx.fillStyle = 'rgba(4, 6, 10, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Master Dialog Frame
    const boxW = 880;
    const boxH = 580;
    const boxX = (CANVAS_WIDTH - boxW) / 2;
    const boxY = (CANVAS_HEIGHT - boxH) / 2;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
    ctx.shadowBlur = 24;
    this.roundRect(ctx, boxX, boxY, boxW, boxH, 18, true, true);
    ctx.shadowBlur = 0;

    // Glowing Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 46px sans-serif';
    ctx.fillText('MONSTERWEAVE', CANVAS_WIDTH / 2, boxY + 72);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('TACTICAL BLOCK ONSLAUGHT', CANVAS_WIDTH / 2, boxY + 108);

    // High Score Badge
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`🏆 ALL-TIME HIGH SCORE: ${bestScore.toLocaleString()} PTS`, CANVAS_WIDTH / 2, boxY + 146);

    // Strategic Concept Card
    const infoY = boxY + 172;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, boxX + 40, infoY, boxW - 80, 180, 12, true, true);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('⚔️ COMBAT & BLOCK DEFENSE RULES ⚔️', CANVAS_WIDTH / 2, infoY + 30);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText('1. Place polyomino gem blocks onto the 8×8 Matrix to defend the Sanctum.', CANVAS_WIDTH / 2, infoY + 62);
    ctx.fillText('2. Placing ANY piece fires gem energy darts to push back incoming monsters.', CANVAS_WIDTH / 2, infoY + 90);
    ctx.fillText('3. Complete Rows & Columns to unleash CATASTROPHIC LASER SALVOS!', CANVAS_WIDTH / 2, infoY + 118);
    ctx.fillText('4. Defend your 6 Hearts & Sanctum Barrier across 10 waves to defeat The Titan!', CANVAS_WIDTH / 2, infoY + 146);

    // Difficulty Selectors
    const diffY = boxY + 385;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('SELECT DIFFICULTY:', CANVAS_WIDTH / 2, diffY);

    DIFFICULTIES.forEach((d, i) => {
      const btnX = CANVAS_WIDTH / 2 - 190 + i * 130;
      const isCur = world.difficultyIndex === i;
      ctx.fillStyle = isCur ? 'rgba(56, 189, 248, 0.25)' : '#1e293b';
      ctx.strokeStyle = isCur ? '#38bdf8' : '#334155';
      ctx.lineWidth = isCur ? 2 : 1;
      this.roundRect(ctx, btnX, diffY + 12, 115, 36, 8, true, true);

      ctx.fillStyle = isCur ? '#38bdf8' : '#94a3b8';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(d.label, btnX + 57, diffY + 35);
    });

    // Start Button
    const btnY = boxY + 480;
    const sGrad = ctx.createLinearGradient(0, btnY, 0, btnY + 56);
    sGrad.addColorStop(0, '#06b6d4');
    sGrad.addColorStop(1, '#0e7490');
    ctx.fillStyle = sGrad;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 18;
    this.roundRect(ctx, CANVAS_WIDTH / 2 - 190, btnY, 380, 56, 14, true, false);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('COMMENCE DEFENSE [CLICK / ENTER]', CANVAS_WIDTH / 2, btnY + 36);

    ctx.restore();
  }

  drawPauseScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(4, 6, 10, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '18px sans-serif';
    ctx.fillText('PRESS [P] OR [SPACE] TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
    ctx.restore();
  }

  drawEndScreen(ctx, world, isVictory, bestScore) {
    ctx.save();
    ctx.fillStyle = 'rgba(4, 6, 10, 0.92)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const boxW = 760;
    const boxH = 550;
    const boxX = (CANVAS_WIDTH - boxW) / 2;
    const boxY = (CANVAS_HEIGHT - boxH) / 2;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = isVictory ? '#22c55e' : '#f43f5e';
    ctx.lineWidth = 3;
    ctx.shadowColor = isVictory ? 'rgba(34, 197, 94, 0.4)' : 'rgba(244, 63, 94, 0.4)';
    ctx.shadowBlur = 25;
    this.roundRect(ctx, boxX, boxY, boxW, boxH, 18, true, true);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';
    ctx.fillStyle = isVictory ? '#22c55e' : '#f43f5e';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(
      isVictory ? '🎉 SANCTUM PRESERVED — VICTORY! 🎉' : '💀 MISSION TERMINATED — SANCTUM BREACHED',
      CANVAS_WIDTH / 2,
      boxY + 65
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(`${world.score.toLocaleString()} PTS`, CANVAS_WIDTH / 2, boxY + 128);

    const rating = world.score > 60000 ? 'S-RANK' : world.score > 35000 ? 'A-RANK' : 'B-RANK';
    ctx.fillStyle = rating === 'S-RANK' ? '#fbbf24' : '#38bdf8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`DEFENSE RATING: ${rating}`, CANVAS_WIDTH / 2, boxY + 168);

    const statY = boxY + 205;
    ctx.fillStyle = '#1e293b';
    this.roundRect(ctx, boxX + 60, statY, boxW - 120, 195, 12, true, false);

    const statsList = [
      { label: 'WAVES COMPLETED:', val: `${world.stats.wavesCleared} / 10` },
      { label: 'MONSTERS SLAIN:', val: `${world.stats.monstersSlain}` },
      { label: 'LINES BLASTED:', val: `${world.stats.linesBlasted}` },
      { label: 'MAX COMBO STREAK:', val: `x${world.stats.maxCombo}` },
      { label: 'ALL-TIME HIGH SCORE:', val: `${Math.max(bestScore, world.score).toLocaleString()}` }
    ];

    statsList.forEach((s, idx) => {
      const sy = statY + 34 + idx * 33;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(s.label, boxX + 90, sy);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(s.val, boxX + boxW - 90, sy);
    });

    const btnY = boxY + 445;
    const rGrad = ctx.createLinearGradient(0, btnY, 0, btnY + 54);
    rGrad.addColorStop(0, '#38bdf8');
    rGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = rGrad;
    ctx.shadowColor = '#38bdf8';
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
