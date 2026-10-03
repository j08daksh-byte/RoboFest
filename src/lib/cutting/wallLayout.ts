/**
 * Layout of the part of the hull plate that is NOT cut away.
 * The plate is split into a few box-shaped runs (coordinate-compressed grid cells merged
 * horizontally, then vertically), so rendering never needs boolean holes even when
 * cut rectangles touch each other.
 */

import type { BoardSize, RawRect } from './rectLayout';

export interface WallRun {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function uniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

export function wallRuns(rects: RawRect[], board: BoardSize): WallRun[] {
  const xs = uniqueSorted([0, board.width, ...rects.flatMap((r) => [r.x, r.x + r.w])]);
  const ys = uniqueSorted([0, board.height, ...rects.flatMap((r) => [r.y, r.y + r.h])]);
  const rows: WallRun[] = [];

  for (let j = 0; j < ys.length - 1; j++) {
    let start: number | null = null;
    for (let i = 0; i < xs.length - 1; i++) {
      const inside = rects.some(
        (r) => xs[i] >= r.x && xs[i + 1] <= r.x + r.w && ys[j] >= r.y && ys[j + 1] <= r.y + r.h,
      );
      if (!inside) {
        if (start === null) start = i;
      } else if (start !== null) {
        rows.push({ x0: xs[start], x1: xs[i], y0: ys[j], y1: ys[j + 1] });
        start = null;
      }
    }
    if (start !== null) rows.push({ x0: xs[start], x1: xs[xs.length - 1], y0: ys[j], y1: ys[j + 1] });
  }

  // Merge vertically adjacent rows with identical horizontal extent.
  rows.sort((a, b) => a.x0 - b.x0 || a.x1 - b.x1 || a.y0 - b.y0);
  const merged: WallRun[] = [];
  for (const r of rows) {
    const last = merged[merged.length - 1];
    if (last && last.x0 === r.x0 && last.x1 === r.x1 && last.y1 === r.y0) last.y1 = r.y1;
    else merged.push({ ...r });
  }
  return merged;
}
