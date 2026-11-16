// MONSTERWEAVE — Main Application Loop, Interaction Controller & Bootstrap

import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_VICTORY,
  BEST_SCORE_KEY, GRID_ORIGIN_X, GRID_ORIGIN_Y, GRID_CELL_SIZE, GRID_GAP,
  GRID_COLS, GRID_ROWS
} from './config.js';
import { createWorld } from './world.js';
import { GameRenderer } from './render.js';
import { InputManager } from './input.js';
import { stageSceneForScreenshot } from './shots.js';
import { toggleAudioMute, startBgmSequence } from './audio.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const renderer = new GameRenderer(canvas);
const input = new InputManager(canvas);

// Deterministic or random RNG
const params = new URLSearchParams(window.location.search);
const shotParam = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);

function createRng(seed = 123456789) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rng = Number.isInteger(seedParam) ? createRng(seedParam) : Math.random;
const world = createWorld(rng);

function readBestScore() {
  try {
    return Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(val) {
  try {
    const cur = readBestScore();
    if (val > cur) {
      localStorage.setItem(BEST_SCORE_KEY, String(val));
    }
  } catch {}
}

let bestScore = readBestScore();

// 1. Screenshot mode
if (shotParam) {
  const scene = stageSceneForScreenshot(shotParam, world);
  let frames = 0;
  function renderShot() {
    renderer.draw(world, scene.screen, null, scene.best);
    frames++;
    if (frames < 3) {
      requestAnimationFrame(renderShot);
    } else {
      window.__shotReady = true;
    }
  }
  requestAnimationFrame(renderShot);
} else {
  // 2. Interactive Mode
  let currentScreen = SCREEN_TITLE;
  let lastTime = performance.now();

  function startDefense() {
    currentScreen = SCREEN_PLAY;
    world.reset(world.difficultyIndex);
    startBgmSequence();
  }

  function handleInteractions() {
    const mouse = input.mouse;

    // Handle Title Screen interactions
    if (currentScreen === SCREEN_TITLE) {
      if (mouse.clicked || input.isKeyJustPressed('Enter') || input.isKeyJustPressed(' ')) {
        const boxY = (CANVAS_HEIGHT - 560) / 2;
        const diffY = boxY + 370;

        // Check if difficulty button clicked
        for (let i = 0; i < 3; i++) {
          const btnX = CANVAS_WIDTH / 2 - 190 + i * 130;
          if (mouse.x >= btnX && mouse.x <= btnX + 115 && mouse.y >= diffY + 12 && mouse.y <= diffY + 48) {
            world.difficultyIndex = i;
            return;
          }
        }

        // Start button or generic click
        startDefense();
      }
      return;
    }

    // Handle Game Over / Victory interactions
    if (currentScreen === SCREEN_OVER || currentScreen === SCREEN_VICTORY) {
      saveBestScore(world.score);
      bestScore = readBestScore();

      if (mouse.clicked || input.isKeyJustPressed('r') || input.isKeyJustPressed('R') || input.isKeyJustPressed('Enter')) {
        startDefense();
      }
      return;
    }

    // Handle Pause
    if (input.isKeyJustPressed('p') || input.isKeyJustPressed('P') || input.isKeyJustPressed('Escape')) {
      currentScreen = currentScreen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
      return;
    }

    if (currentScreen === SCREEN_PAUSED) {
      if (mouse.clicked || input.isKeyJustPressed(' ')) {
        currentScreen = SCREEN_PLAY;
      }
      return;
    }

    // Toggle Audio
    if (input.isKeyJustPressed('m') || input.isKeyJustPressed('M')) {
      toggleAudioMute();
    }

    // Check mute button click in HUD
    if (mouse.clicked && mouse.x >= CANVAS_WIDTH / 2 + 30 && mouse.x <= CANVAS_WIDTH / 2 + 130 && mouse.y <= 60) {
      toggleAudioMute();
      return;
    }

    // Keyboard selection 1, 2, 3
    if (input.isKeyJustPressed('1')) input.selectedPieceIndex = 0;
    if (input.isKeyJustPressed('2')) input.selectedPieceIndex = 1;
    if (input.isKeyJustPressed('3')) input.selectedPieceIndex = 2;

    // Tray Piece Selection & Dragging
    const trayY = 585;
    const slotW = 145;
    const slotH = 105;
    const gap = 15;
    const trayStartX = GRID_ORIGIN_X - 10;

    if (mouse.clicked) {
      for (let i = 0; i < 3; i++) {
        const slotX = trayStartX + i * (slotW + gap);
        if (mouse.x >= slotX && mouse.x <= slotX + slotW && mouse.y >= trayY && mouse.y <= trayY + slotH) {
          if (!world.tray[i].placed) {
            input.draggedPieceIndex = i;
            input.selectedPieceIndex = i;
            return;
          }
        }
      }

      // If clicked on grid with selected piece
      if (input.selectedPieceIndex >= 0) {
        const gridCoord = renderer.getGridCoordsFromMouse(mouse.x, mouse.y);
        if (gridCoord) {
          const placed = world.placePiece(input.selectedPieceIndex, gridCoord.col, gridCoord.row);
          if (placed) {
            input.selectedPieceIndex = -1;
            input.draggedPieceIndex = -1;
          }
        }
      }
    }

    // Dropping dragged piece onto grid
    if (mouse.released && input.draggedPieceIndex >= 0) {
      const pieceIdx = input.draggedPieceIndex;
      const piece = world.tray[pieceIdx];

      if (piece) {
        // Adjust for piece center offset
        const gridCoord = renderer.getGridCoordsFromMouse(
          mouse.x - (piece.cols * GRID_CELL_SIZE) / 2 + GRID_CELL_SIZE / 2,
          mouse.y - (piece.rows * GRID_CELL_SIZE) / 2 + GRID_CELL_SIZE / 2
        );

        if (gridCoord) {
          world.placePiece(pieceIdx, gridCoord.col, gridCoord.row);
        }
      }
      input.draggedPieceIndex = -1;
      input.selectedPieceIndex = -1;
    }

    // Check game over transition
    if (world.isGameOver) {
      currentScreen = SCREEN_OVER;
      saveBestScore(world.score);
      bestScore = readBestScore();
    } else if (world.isVictory) {
      currentScreen = SCREEN_VICTORY;
      saveBestScore(world.score);
      bestScore = readBestScore();
    }
  }

  function gameLoop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    handleInteractions();

    if (currentScreen === SCREEN_PLAY) {
      world.step(dt);
    }

    renderer.draw(world, currentScreen, input, bestScore);
    input.clearPerFrame();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}
