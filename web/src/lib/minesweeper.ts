export type CellModel = {
  isMine: boolean;
  adjacent: number;
  revealed: boolean;
  flagged: boolean;
};

export type LevelSpec = {
  name: string;
  rows: number;
  cols: number;
  mines: number;
};

export const LEVELS: readonly LevelSpec[] = [
  { name: "Sector 01", rows: 8, cols: 8, mines: 8 },
  { name: "Sector 02", rows: 9, cols: 9, mines: 12 },
  { name: "Sector 03", rows: 10, cols: 10, mines: 16 },
  { name: "Sector 04", rows: 11, cols: 11, mines: 22 },
  { name: "Sector 05", rows: 12, cols: 12, mines: 28 },
  { name: "Sector 06", rows: 13, cols: 13, mines: 35 },
  { name: "Sector 07", rows: 14, cols: 14, mines: 42 },
  { name: "Sector 08", rows: 14, cols: 16, mines: 52 },
];

function idx(r: number, c: number, cols: number) {
  return r * cols + c;
}

function neighbors(r: number, c: number, rows: number, cols: number) {
  const out: { r: number; c: number }[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push({ r: nr, c: nc });
    }
  }
  return out;
}

export function buildEmptyGrid(rows: number, cols: number): CellModel[] {
  const n = rows * cols;
  return Array.from({ length: n }, () => ({
    isMine: false,
    adjacent: 0,
    revealed: false,
    flagged: false,
  }));
}

export function placeMines(
  grid: CellModel[],
  rows: number,
  cols: number,
  mines: number,
  safeR: number,
  safeC: number,
): CellModel[] {
  const n = rows * cols;
  const forbidden = new Set<number>();
  forbidden.add(idx(safeR, safeC, cols));
  for (const { r, c } of neighbors(safeR, safeC, rows, cols)) {
    forbidden.add(idx(r, c, cols));
  }

  const candidates: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!forbidden.has(i)) candidates.push(i);
  }

  const copy = grid.map((c) => ({ ...c }));
  const rng = [...candidates];
  for (let i = rng.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rng[i], rng[j]] = [rng[j], rng[i]];
  }

  const picks = rng.slice(0, Math.min(mines, rng.length));
  for (const p of picks) {
    copy[p].isMine = true;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = idx(r, c, cols);
      if (copy[i].isMine) {
        copy[i].adjacent = 0;
        continue;
      }
      let a = 0;
      for (const { r: nr, c: nc } of neighbors(r, c, rows, cols)) {
        if (copy[idx(nr, nc, cols)].isMine) a++;
      }
      copy[i].adjacent = a;
    }
  }

  return copy;
}

export function revealCell(
  grid: CellModel[],
  rows: number,
  cols: number,
  startR: number,
  startC: number,
): { grid: CellModel[]; hitMine: boolean } {
  const i = idx(startR, startC, cols);
  const cell = grid[i];
  if (cell.flagged || cell.revealed) return { grid, hitMine: false };

  const copy = grid.map((c) => ({ ...c }));

  if (copy[i].isMine) {
    copy[i].revealed = true;
    return { grid: copy, hitMine: true };
  }

  const stack: { r: number; c: number }[] = [{ r: startR, c: startC }];
  while (stack.length) {
    const { r, c } = stack.pop()!;
    const j = idx(r, c, cols);
    if (copy[j].revealed || copy[j].flagged || copy[j].isMine) continue;
    copy[j].revealed = true;
    if (copy[j].adjacent === 0) {
      for (const { r: nr, c: nc } of neighbors(r, c, rows, cols)) {
        const k = idx(nr, nc, cols);
        if (!copy[k].revealed && !copy[k].flagged && !copy[k].isMine) {
          stack.push({ r: nr, c: nc });
        }
      }
    }
  }

  return { grid: copy, hitMine: false };
}

export function chordCell(
  grid: CellModel[],
  rows: number,
  cols: number,
  r: number,
  c: number,
): { grid: CellModel[]; hitMine: boolean } {
  const i = idx(r, c, cols);
  const center = grid[i];
  if (!center.revealed || center.isMine || center.adjacent === 0) {
    return { grid, hitMine: false };
  }

  let flags = 0;
  const hidden: { r: number; c: number }[] = [];
  for (const { r: nr, c: nc } of neighbors(r, c, rows, cols)) {
    const j = idx(nr, nc, cols);
    const cell = grid[j];
    if (cell.flagged) flags++;
    else if (!cell.revealed) hidden.push({ r: nr, c: nc });
  }

  if (flags !== center.adjacent) return { grid, hitMine: false };

  let copy = grid.map((x) => ({ ...x }));
  let hitMine = false;
  for (const { r: hr, c: hc } of hidden) {
    const res = revealCell(copy, rows, cols, hr, hc);
    copy = res.grid;
    if (res.hitMine) hitMine = true;
  }
  return { grid: copy, hitMine };
}

export function toggleFlag(grid: CellModel[], rows: number, cols: number, r: number, c: number) {
  const i = idx(r, c, cols);
  if (grid[i].revealed) return grid;
  const copy = grid.map((x) => ({ ...x }));
  copy[i].flagged = !copy[i].flagged;
  return copy;
}

export function clearFlag(grid: CellModel[], rows: number, cols: number, r: number, c: number) {
  const i = idx(r, c, cols);
  if (!grid[i].flagged) return grid;
  const copy = grid.map((x) => ({ ...x }));
  copy[i].flagged = false;
  return copy;
}

export function isWin(grid: CellModel[]) {
  return grid.every((cell) => cell.isMine || cell.revealed);
}

export function revealAllMines(grid: CellModel[]) {
  return grid.map((c) => (c.isMine ? { ...c, revealed: true } : { ...c }));
}
