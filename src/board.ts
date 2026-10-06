import type { Coordinate } from "./types";

export const SAFE_CELLS: Coordinate[] = [
  { r: 0, c: 2 },
  { r: 2, c: 4 },
  { r: 4, c: 2 },
  { r: 2, c: 0 },
  { r: 2, c: 2 }
];

export function isSafeCell(r: number, c: number): boolean {
  return SAFE_CELLS.some(cell => cell.r === r && cell.c === c);
}

export const P1_PATH: Coordinate[] = [
  { r: 0, c: 2 }, { r: 0, c: 1 }, { r: 0, c: 0 }, { r: 1, c: 0 },
  { r: 2, c: 0 }, { r: 3, c: 0 }, { r: 4, c: 0 }, { r: 4, c: 1 },
  { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 4 }, { r: 3, c: 4 },
  { r: 2, c: 4 }, { r: 1, c: 4 }, { r: 0, c: 4 }, { r: 0, c: 3 },
  { r: 1, c: 3 }, { r: 2, c: 3 }, { r: 3, c: 3 }, { r: 3, c: 2 },
  { r: 3, c: 1 }, { r: 2, c: 1 }, { r: 1, c: 1 }, { r: 1, c: 2 },
  { r: 2, c: 2 }
];

export const P2_PATH: Coordinate[] = [
  { r: 2, c: 4 }, { r: 1, c: 4 }, { r: 0, c: 4 }, { r: 0, c: 3 },
  { r: 0, c: 2 }, { r: 0, c: 1 }, { r: 0, c: 0 }, { r: 1, c: 0 },
  { r: 2, c: 0 }, { r: 3, c: 0 }, { r: 4, c: 0 }, { r: 4, c: 1 },
  { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 4 }, { r: 3, c: 4 },
  { r: 3, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 1 }, { r: 2, c: 1 },
  { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 },
  { r: 2, c: 2 }
];

export const P3_PATH: Coordinate[] = [
  { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 4 }, { r: 3, c: 4 },
  { r: 2, c: 4 }, { r: 1, c: 4 }, { r: 0, c: 4 }, { r: 0, c: 3 },
  { r: 0, c: 2 }, { r: 0, c: 1 }, { r: 0, c: 0 }, { r: 1, c: 0 },
  { r: 2, c: 0 }, { r: 3, c: 0 }, { r: 4, c: 0 }, { r: 4, c: 1 },
  { r: 3, c: 1 }, { r: 2, c: 1 }, { r: 1, c: 1 }, { r: 1, c: 2 },
  { r: 1, c: 3 }, { r: 2, c: 3 }, { r: 3, c: 3 }, { r: 3, c: 2 },
  { r: 2, c: 2 }
];

export const P4_PATH: Coordinate[] = [
  { r: 2, c: 0 }, { r: 3, c: 0 }, { r: 4, c: 0 }, { r: 4, c: 1 },
  { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 4 }, { r: 3, c: 4 },
  { r: 2, c: 4 }, { r: 1, c: 4 }, { r: 0, c: 4 }, { r: 0, c: 3 },
  { r: 0, c: 2 }, { r: 0, c: 1 }, { r: 0, c: 0 }, { r: 1, c: 0 },
  { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 },
  { r: 3, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 1 }, { r: 2, c: 1 },
  { r: 2, c: 2 }
];

export const PATHS: Record<string, Coordinate[]> = {
  P1: P1_PATH,
  P2: P2_PATH,
  P3: P3_PATH,
  P4: P4_PATH
};
