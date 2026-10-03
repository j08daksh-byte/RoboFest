/**
 * Ship cutting plan.
 * The whole ship silhouette is built ONLY from axis-aligned rectangles/squares,
 * and every cut is a straight horizontal or vertical line segment.
 * Units are grid units on a 100 x 40 drawing board (y grows downward).
 */

export interface ShipBlock {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CutSegment {
  index: number;
  blockId: string;
  blockName: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
}

export const BOARD = { width: 100, height: 40 };

// Listed in cutting order: superstructure first (top), hull last.
export const SHIP_BLOCKS: ShipBlock[] = [
  { id: 'B1', name: 'Funnel (square)', x: 32, y: 4, w: 6, h: 6 },
  { id: 'B2', name: 'Bridge', x: 26, y: 10, w: 14, h: 6 },
  { id: 'B3', name: 'Deck House', x: 20, y: 16, w: 30, h: 8 },
  { id: 'B4', name: 'Cargo Block', x: 58, y: 19, w: 22, h: 5 },
  { id: 'B5', name: 'Main Hull', x: 4, y: 24, w: 88, h: 10 },
  { id: 'B6', name: 'Bow Section', x: 92, y: 28, w: 6, h: 6 },
];

type Interval = [number, number];

function subtract(base: Interval, covered: Interval[]): Interval[] {
  let parts: Interval[] = [base];
  for (const [cs, ce] of covered) {
    const next: Interval[] = [];
    for (const [s, e] of parts) {
      if (ce <= s || cs >= e) {
        next.push([s, e]);
        continue;
      }
      if (cs > s) next.push([s, cs]);
      if (ce < e) next.push([ce, e]);
    }
    parts = next;
  }
  return parts;
}

/** Builds ordered straight cuts. Edges shared by two blocks are only cut once. */
export function buildCutPlan(blocks: ShipBlock[] = SHIP_BLOCKS): CutSegment[] {
  const segments: CutSegment[] = [];
  const cutH = new Map<number, Interval[]>(); // y -> x-intervals already cut
  const cutV = new Map<number, Interval[]>(); // x -> y-intervals already cut

  const add = (b: ShipBlock, horizontal: boolean, fixed: number, a: number, z: number) => {
    const map = horizontal ? cutH : cutV;
    const existing = map.get(fixed) ?? [];
    for (const [s, e] of subtract([a, z], existing)) {
      segments.push({
        index: segments.length,
        blockId: b.id,
        blockName: b.name,
        x1: horizontal ? s : fixed,
        y1: horizontal ? fixed : s,
        x2: horizontal ? e : fixed,
        y2: horizontal ? fixed : e,
        length: e - s,
      });
      existing.push([s, e]);
    }
    map.set(fixed, existing);
  };

  for (const b of blocks) {
    add(b, true, b.y, b.x, b.x + b.w); // top
    add(b, false, b.x + b.w, b.y, b.y + b.h); // right
    add(b, true, b.y + b.h, b.x, b.x + b.w); // bottom
    add(b, false, b.x, b.y, b.y + b.h); // left
  }
  return segments;
}

/** Every cut must be a straight horizontal or vertical line. */
export function isStraightAxisAligned(s: CutSegment): boolean {
  return (s.x1 === s.x2) !== (s.y1 === s.y2) && s.length > 0;
}

export const CUT_PLAN: CutSegment[] = buildCutPlan();
export const CUT_PLAN_TOTAL_LENGTH = CUT_PLAN.reduce((sum, s) => sum + s.length, 0);

/** Position of the torch for a given mission progress (0-100). */
export function torchAtProgress(progress: number, plan: CutSegment[] = CUT_PLAN) {
  const total = plan.reduce((sum, s) => sum + s.length, 0);
  let remaining = (Math.max(0, Math.min(100, progress)) / 100) * total;
  for (const s of plan) {
    if (remaining <= s.length) {
      const t = s.length === 0 ? 0 : remaining / s.length;
      return {
        segmentIndex: s.index,
        x: s.x1 + (s.x2 - s.x1) * t,
        y: s.y1 + (s.y2 - s.y1) * t,
        done: false,
      };
    }
    remaining -= s.length;
  }
  const last = plan[plan.length - 1];
  return { segmentIndex: last.index, x: last.x2, y: last.y2, done: true };
}
