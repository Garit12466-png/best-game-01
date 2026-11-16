// MONSTERWEAVE — Polyomino Block Shapes & 8x8 Tactical Grid Logic

import { GRID_COLS, GRID_ROWS, GEM_TYPES } from './config.js';

/** Standard Block Blast polyomino shapes (matrix of 0/1) */
export const SHAPE_DEFINITIONS = [
  // 1-cell dot
  { id: 'dot', matrix: [[1]] },

  // Lines
  { id: 'line_h2', matrix: [[1, 1]] },
  { id: 'line_v2', matrix: [[1], [1]] },
  { id: 'line_h3', matrix: [[1, 1, 1]] },
  { id: 'line_v3', matrix: [[1], [1], [1]] },
  { id: 'line_h4', matrix: [[1, 1, 1, 1]] },
  { id: 'line_v4', matrix: [[1], [1], [1], [1]] },
  { id: 'line_h5', matrix: [[1, 1, 1, 1, 1]] },

  // Squares
  { id: 'square_2', matrix: [[1, 1], [1, 1]] },
  { id: 'square_3', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },

  // Rectangles
  { id: 'rect_2x3', matrix: [[1, 1], [1, 1], [1, 1]] },
  { id: 'rect_3x2', matrix: [[1, 1, 1], [1, 1, 1]] },

  // Small Corner
  { id: 'corner_tl', matrix: [[1, 1], [1, 0]] },
  { id: 'corner_tr', matrix: [[1, 1], [0, 1]] },
  { id: 'corner_bl', matrix: [[1, 0], [1, 1]] },
  { id: 'corner_br', matrix: [[0, 1], [1, 1]] },

  // Standard L-Shapes
  { id: 'L_1', matrix: [[1, 0], [1, 0], [1, 1]] },
  { id: 'L_2', matrix: [[0, 1], [0, 1], [1, 1]] },
  { id: 'L_3', matrix: [[1, 1, 1], [1, 0, 0]] },
  { id: 'L_4', matrix: [[1, 1, 1], [0, 0, 1]] },

  // T-Shapes
  { id: 'T_1', matrix: [[1, 1, 1], [0, 1, 0]] },
  { id: 'T_2', matrix: [[0, 1, 0], [1, 1, 1]] },
  { id: 'T_3', matrix: [[1, 0], [1, 1], [1, 0]] },

  // Z / S Shapes
  { id: 'Z_1', matrix: [[1, 1, 0], [0, 1, 1]] },
  { id: 'S_1', matrix: [[0, 1, 1], [1, 1, 0]] }
];

export function createEmptyGrid() {
  const grid = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push(null);
    }
    grid.push(row);
  }
  return grid;
}

export function generateRandomPiece(rng) {
  const shapeDef = SHAPE_DEFINITIONS[Math.floor(rng() * SHAPE_DEFINITIONS.length)];
  const gemType = GEM_TYPES[Math.floor(rng() * GEM_TYPES.length)];
  return {
    id: `${shapeDef.id}_${Math.floor(rng() * 100000)}`,
    shape: shapeDef.matrix,
    rows: shapeDef.matrix.length,
    cols: shapeDef.matrix[0].length,
    gemType: gemType,
    placed: false
  };
}

export function generatePieceTray(rng) {
  return [
    generateRandomPiece(rng),
    generateRandomPiece(rng),
    generateRandomPiece(rng)
  ];
}

export function canPlaceShape(grid, matrix, startCol, startRow) {
  const rows = matrix.length;
  const cols = matrix[0].length;

  if (startCol < 0 || startRow < 0) return false;
  if (startCol + cols > GRID_COLS || startRow + rows > GRID_ROWS) return false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] === 1) {
        if (grid[startRow + r][startCol + c] !== null) {
          return false;
        }
      }
    }
  }
  return true;
}

export function placeShapeOnGrid(grid, matrix, startCol, startRow, gemType) {
  const placedCells = [];
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 1) {
        grid[startRow + r][startCol + c] = {
          gemType: gemType,
          color: gemType.color,
          flash: 0.15
        };
        placedCells.push({ col: startCol + c, row: startRow + r });
      }
    }
  }
  return placedCells;
}

export function findCompletedLines(grid) {
  const rowsToClear = [];
  const colsToClear = [];

  // Check complete rows
  for (let r = 0; r < GRID_ROWS; r++) {
    let full = true;
    for (let c = 0; c < GRID_COLS; c++) {
      if (grid[r][c] === null) {
        full = false;
        break;
      }
    }
    if (full) rowsToClear.push(r);
  }

  // Check complete columns
  for (let c = 0; c < GRID_COLS; c++) {
    let full = true;
    for (let r = 0; r < GRID_ROWS; r++) {
      if (grid[r][c] === null) {
        full = false;
        break;
      }
    }
    if (full) colsToClear.push(c);
  }

  return { rows: rowsToClear, cols: colsToClear };
}

export function clearLinesFromGrid(grid, completed) {
  const clearedGems = [];

  completed.rows.forEach(r => {
    for (let c = 0; c < GRID_COLS; c++) {
      if (grid[r][c]) {
        clearedGems.push({ col: c, row: r, gem: grid[r][c] });
        grid[r][c] = null;
      }
    }
  });

  completed.cols.forEach(c => {
    for (let r = 0; r < GRID_ROWS; r++) {
      if (grid[r][c]) {
        clearedGems.push({ col: c, row: r, gem: grid[r][c] });
        grid[r][c] = null;
      }
    }
  });

  return clearedGems;
}

/** Check if any piece in tray can fit anywhere on the grid */
export function hasPossibleMove(grid, trayPieces) {
  const unplaced = trayPieces.filter(p => !p.placed);
  if (unplaced.length === 0) return true;

  for (const piece of unplaced) {
    for (let r = 0; r <= GRID_ROWS - piece.rows; r++) {
      for (let c = 0; c <= GRID_COLS - piece.cols; c++) {
        if (canPlaceShape(grid, piece.shape, c, r)) {
          return true;
        }
      }
    }
  }
  return false;
}
