/**
 * Rectangle layout model for photo-driven ship cutting.
 *
 * The robot can only move in straight lines and cannot cut while turning, so every
 * region to be removed is an axis-aligned rectangle (a square is a rectangle with w === h).
 * Units are board grid units: the board is BOARD_WIDTH units wide and its height follows
 * the aspect ratio of the uploaded photo. y grows downward (image coordinates).
 */

export const BOARD_WIDTH = 100;
export const MIN_RECT_SIZE = 2;

export interface BoardSize {
  width: number;
  height: number;
}

export interface CutRect {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RawRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type RectCheck = { ok: true } | { ok: false; reason: string };

/** Board height (grid units) for an image of the given pixel size. */
export function boardHeightFor(imageWidth: number, imageHeight: number): number {
  if (!imageWidth || !imageHeight) return Math.round(BOARD_WIDTH * 9 / 16);
  return Math.max(20, Math.round((BOARD_WIDTH * imageHeight) / imageWidth));
}

export function rectsOverlap(a: RawRect, b: RawRect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Normalises a dragged rectangle (any corner order), snaps to the integer grid and clamps to the board. */
export function snapRect(raw: RawRect, board: BoardSize): RawRect {
  const x1 = Math.min(raw.x, raw.x + raw.w);
  const x2 = Math.max(raw.x, raw.x + raw.w);
  const y1 = Math.min(raw.y, raw.y + raw.h);
  const y2 = Math.max(raw.y, raw.y + raw.h);
  const sx1 = Math.max(0, Math.min(board.width, Math.round(x1)));
  const sx2 = Math.max(0, Math.min(board.width, Math.round(x2)));
  const sy1 = Math.max(0, Math.min(board.height, Math.round(y1)));
  const sy2 = Math.max(0, Math.min(board.height, Math.round(y2)));
  return { x: sx1, y: sy1, w: sx2 - sx1, h: sy2 - sy1 };
}

export function validateRect(rect: RawRect, existing: RawRect[], board: BoardSize): RectCheck {
  if (rect.w < MIN_RECT_SIZE || rect.h < MIN_RECT_SIZE) {
    return { ok: false, reason: `Rectangle too small (minimum ${MIN_RECT_SIZE} x ${MIN_RECT_SIZE} units).` };
  }
  if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > board.width || rect.y + rect.h > board.height) {
    return { ok: false, reason: 'Rectangle must stay inside the photo.' };
  }
  if (existing.some((r) => rectsOverlap(rect, r))) {
    return { ok: false, reason: 'Rectangles cannot overlap. Pieces may only touch along an edge.' };
  }
  return { ok: true };
}

export function validateLayout(rects: RawRect[], board: BoardSize): RectCheck {
  if (rects.length === 0) return { ok: false, reason: 'Mark at least one rectangle to cut.' };
  for (let i = 0; i < rects.length; i++) {
    const check = validateRect(rects[i], rects.slice(0, i), board);
    if (!check.ok) return check;
  }
  return { ok: true };
}

export function nextRectId(existing: CutRect[]): string {
  let n = existing.length + 1;
  const ids = new Set(existing.map((r) => r.id));
  while (ids.has(`P${n}`)) n++;
  return `P${n}`;
}

export function makeRect(raw: RawRect, existing: CutRect[]): CutRect {
  const id = nextRectId(existing);
  return { id, name: `Piece ${id.slice(1)}`, ...raw };
}

/** Builds CutRects from raw rectangles, re-numbering them in reading order (top to bottom, left to right). */
export function rectsFromRaw(raws: RawRect[]): CutRect[] {
  const sorted = [...raws].sort((a, b) => a.y - b.y || a.x - b.x);
  return sorted.map((r, i) => ({ id: `P${i + 1}`, name: `Piece ${i + 1}`, x: r.x, y: r.y, w: r.w, h: r.h }));
}

export function layoutSignature(rects: RawRect[], board: BoardSize): string {
  return `${board.width}x${board.height}:` + rects.map((r) => `${r.x},${r.y},${r.w},${r.h}`).join(';');
}
