/**
 * Detects the regions a user has marked on a ship photo.
 *
 * The user paints (filled) or outlines (hollow) rectangles on the photo with a bright marker colour.
 * Pixels matching that colour are collected into a coarse board grid, hollow outlines are filled in,
 * and every marked region is converted into axis-aligned rectangles (L / T shapes are split into
 * several rectangles) because the robot can only cut straight lines.
 */

import { MIN_RECT_SIZE } from './rectLayout';
import type { BoardSize, RawRect } from './rectLayout';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface MarkOptions {
  board: BoardSize;
  /** Marker colour. When omitted the most common pure (very saturated) colour is used. */
  target?: RGB | null;
  /** Hue tolerance in degrees for chromatic markers. */
  hueTolerance?: number;
  /** Ignore marked regions smaller than this many grid cells. */
  minCells?: number;
}

export interface MarkResult {
  rects: RawRect[];
  marker: RGB | null;
  message: string;
}

type Pixels = Uint8ClampedArray | Uint8Array | number[];

export function rgbToHsv({ r, g, b }: RGB): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const c = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function hexToRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 255, g: 0, b: 255 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Picks the dominant very-saturated colour of the picture (typical marker pen colour). */
export function guessMarkerColor(data: Pixels, width: number, height: number): RGB | null {
  const bins = 24;
  const count = new Array(bins).fill(0);
  const sum = Array.from({ length: bins }, () => ({ r: 0, g: 0, b: 0 }));
  const total = width * height;
  const step = Math.max(1, Math.floor(total / 200000));
  for (let p = 0; p < total; p += step) {
    const i = p * 4;
    const rgb = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const { h, s, v } = rgbToHsv(rgb);
    if (s < 0.8 || v < 0.8) continue;
    const bin = Math.min(bins - 1, Math.floor(h / (360 / bins)));
    count[bin]++;
    sum[bin].r += rgb.r;
    sum[bin].g += rgb.g;
    sum[bin].b += rgb.b;
  }
  let best = -1;
  for (let i = 0; i < bins; i++) if (best < 0 || count[i] > count[best]) best = i;
  const sampled = Math.ceil(total / step);
  if (best < 0 || count[best] < Math.max(30, sampled * 0.0005)) return null;
  return { r: sum[best].r / count[best], g: sum[best].g / count[best], b: sum[best].b / count[best] };
}

function makeMatcher(target: RGB, hueTolerance: number) {
  const t = rgbToHsv(target);
  const chromatic = t.s >= 0.35 && t.v >= 0.25;
  if (chromatic) {
    return (r: number, g: number, b: number) => {
      const { h, s, v } = rgbToHsv({ r, g, b });
      return s >= 0.45 && v >= 0.3 && hueDistance(h, t.h) <= hueTolerance;
    };
  }
  const limit = 70;
  return (r: number, g: number, b: number) => {
    const dr = r - target.r;
    const dg = g - target.g;
    const db = b - target.b;
    return Math.sqrt(dr * dr + dg * dg + db * db) <= limit;
  };
}

type Mask = Uint8Array;

function neighbours4(i: number, w: number, h: number, out: number[]) {
  out.length = 0;
  const x = i % w;
  const y = (i - x) / w;
  if (x > 0) out.push(i - 1);
  if (x < w - 1) out.push(i + 1);
  if (y > 0) out.push(i - w);
  if (y < h - 1) out.push(i + w);
}

function dilate(mask: Mask, w: number, h: number): Mask {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = 0;
      for (let dy = -1; dy <= 1 && !on; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h && mask[ny * w + nx]) {
            on = 1;
            break;
          }
        }
      }
      out[y * w + x] = on;
    }
  }
  return out;
}

/** Erosion where cells outside the board count as set so shapes touching the border stay flush. */
function erode(mask: Mask, w: number, h: number): Mask {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = 1;
      for (let dy = -1; dy <= 1 && on; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h && !mask[ny * w + nx]) {
            on = 0;
            break;
          }
        }
      }
      out[y * w + x] = on;
    }
  }
  return out;
}

/** Marks every cell that is NOT reachable from the border without crossing the barrier. */
function fillEnclosed(barrier: Mask, w: number, h: number): Mask {
  const outside = new Uint8Array(barrier.length);
  const stack: number[] = [];
  const push = (i: number) => {
    if (!barrier[i] && !outside[i]) {
      outside[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  const nb: number[] = [];
  while (stack.length) {
    const i = stack.pop() as number;
    neighbours4(i, w, h, nb);
    for (const n of nb) push(n);
  }
  const region = new Uint8Array(barrier.length);
  for (let i = 0; i < region.length; i++) region[i] = outside[i] ? 0 : 1;
  return region;
}

function components(region: Mask, w: number, h: number): number[][] {
  const seen = new Uint8Array(region.length);
  const comps: number[][] = [];
  const nb: number[] = [];
  for (let start = 0; start < region.length; start++) {
    if (!region[start] || seen[start]) continue;
    const cells: number[] = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop() as number;
      cells.push(i);
      neighbours4(i, w, h, nb);
      for (const n of nb) {
        if (region[n] && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    comps.push(cells);
  }
  return comps;
}

/** Splits an arbitrary rectilinear cell set into non-overlapping rectangles (greedy, row by row). */
export function decomposeIntoRects(cells: number[], w: number): RawRect[] {
  const inComp = new Set(cells);
  const free = new Set(cells);
  const ordered = [...cells].sort((a, b) => a - b);
  const rects: RawRect[] = [];
  for (const start of ordered) {
    if (!free.has(start)) continue;
    const x0 = start % w;
    const y0 = (start - x0) / w;
    let rw = 1;
    while (free.has(y0 * w + x0 + rw) && x0 + rw < w) rw++;
    let rh = 1;
    for (;;) {
      let rowOk = true;
      for (let dx = 0; dx < rw; dx++) {
        const idx = (y0 + rh) * w + x0 + dx;
        if (!inComp.has(idx) || !free.has(idx)) {
          rowOk = false;
          break;
        }
      }
      if (!rowOk) break;
      rh++;
    }
    for (let dy = 0; dy < rh; dy++) for (let dx = 0; dx < rw; dx++) free.delete((y0 + dy) * w + x0 + dx);
    rects.push({ x: x0, y: y0, w: rw, h: rh });
  }
  return rects;
}

export function detectMarkedRects(data: Pixels, width: number, height: number, opts: MarkOptions): MarkResult {
  const { board } = opts;
  const bw = board.width;
  const bh = board.height;
  const minCells = opts.minCells ?? 6;

  const marker = opts.target ?? guessMarkerColor(data, width, height);
  if (!marker) {
    return { rects: [], marker: null, message: 'No marker colour found. Pick the colour you used to mark the cuts.' };
  }
  const match = makeMatcher(marker, opts.hueTolerance ?? 20);

  const hits = new Float32Array(bw * bh);
  const totals = new Float32Array(bw * bh);
  for (let y = 0; y < height; y++) {
    const cy = Math.min(bh - 1, Math.floor((y * bh) / height));
    for (let x = 0; x < width; x++) {
      const cx = Math.min(bw - 1, Math.floor((x * bw) / width));
      const i = (y * width + x) * 4;
      const ci = cy * bw + cx;
      totals[ci]++;
      if (match(data[i], data[i + 1], data[i + 2])) hits[ci]++;
    }
  }
  const marked: Mask = new Uint8Array(bw * bh);
  let markedCells = 0;
  for (let i = 0; i < marked.length; i++) {
    if (totals[i] > 0 && hits[i] / totals[i] >= 0.2) {
      marked[i] = 1;
      markedCells++;
    }
  }
  if (markedCells === 0) {
    return { rects: [], marker, message: 'No marked area found with this colour.' };
  }

  const region = erode(fillEnclosed(dilate(marked, bw, bh), bw, bh), bw, bh);

  const comps = components(region, bw, bh).filter((c) => c.length >= minCells);
  const rects: RawRect[] = [];
  for (const cells of comps) {
    let minX = bw;
    let minY = bh;
    let maxX = -1;
    let maxY = -1;
    for (const i of cells) {
      const x = i % bw;
      const y = (i - x) / bw;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const boxArea = (maxX - minX + 1) * (maxY - minY + 1);
    let inside = 0;
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) if (region[y * bw + x]) inside++;
    if (cells.length / boxArea >= 0.92 && inside === cells.length) {
      rects.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
    } else {
      rects.push(...decomposeIntoRects(cells, bw));
    }
  }

  const clean = rects.filter((r) => r.w >= MIN_RECT_SIZE && r.h >= MIN_RECT_SIZE);
  if (clean.length === 0) {
    return { rects: [], marker, message: 'Marked areas were too small to cut.' };
  }
  return {
    rects: clean,
    marker,
    message: `Detected ${clean.length} rectangular cut ${clean.length === 1 ? 'region' : 'regions'} from the marks.`,
  };
}
