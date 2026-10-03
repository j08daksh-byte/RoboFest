/**
 * Straight-line cut path planner.
 *
 * Robot constraints encoded here:
 *  - the robot only moves in straight lines (horizontal / vertical on the hull plate);
 *  - it can turn, but the torch is OFF while it turns and while it travels between cuts;
 *  - cutting happens only along rectangle edges (squares / rectangles only).
 *
 * The planner produces an ordered list of steps (travel / turn / cut) and, for each piece,
 * the distance at which its last edge is cut, i.e. the moment the piece separates and falls.
 */

import type { BoardSize, CutRect, RawRect } from './rectLayout';

export type StepKind = 'travel' | 'turn' | 'cut';

export interface PathStep {
  index: number;
  kind: StepKind;
  /** Piece this step belongs to (the piece being cut, or the next piece for travel/turn steps). */
  pieceId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Path length in grid units (turn steps use an equivalent time cost). */
  length: number;
  startDist: number;
  endDist: number;
  /** Heading (radians, world plane: x right, y up) at the start / end of the step. */
  heading1: number;
  heading2: number;
}

export interface PlannedPiece {
  rect: CutRect;
  /** Cutting order, 0-based. */
  order: number;
  /** Index of the last cut step that touches this piece's outline. */
  releaseStep: number;
  /** Path distance at which the piece is completely cut free. */
  releaseDist: number;
}

export interface CutJobPlan {
  board: BoardSize;
  steps: PathStep[];
  pieces: PlannedPiece[];
  totalLength: number;
  cutLength: number;
  travelLength: number;
  cutCount: number;
  turnCount: number;
}

export interface RobotPose {
  x: number;
  y: number;
  heading: number;
  torchOn: boolean;
  kind: StepKind | 'idle' | 'done';
  stepIndex: number;
  pieceId: string | null;
}

type Interval = [number, number];
type Point = { x: number; y: number };

/** Equivalent path length of a full 90 degree turn (the robot stops and pivots, torch off). */
export const TURN_COST_PER_QUARTER = 2;

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

function headingOf(dx: number, dy: number): number {
  // y grows downward in board space, but the world "up" is -y.
  return Math.atan2(-dy, dx);
}

function normalizeAngle(a: number): number {
  let r = a;
  while (r > Math.PI) r -= Math.PI * 2;
  while (r <= -Math.PI) r += Math.PI * 2;
  return r;
}

interface RawStep {
  kind: 'travel' | 'cut';
  pieceId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Pieces are visited greedily: always the nearest start corner next (Manhattan distance). */
function orderRects(rects: CutRect[], home: Point): CutRect[] {
  const remaining = [...rects];
  const ordered: CutRect[] = [];
  let cur = home;
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((r, i) => {
      const d = Math.abs(r.x - cur.x) + Math.abs(r.y - cur.y);
      if (d < bestDist - 1e-9 || (Math.abs(d - bestDist) < 1e-9 && (r.y < remaining[bestIdx].y || (r.y === remaining[bestIdx].y && r.x < remaining[bestIdx].x)))) {
        bestDist = d;
        bestIdx = i;
      }
    });
    const [next] = remaining.splice(bestIdx, 1);
    ordered.push(next);
    // The loop is closed, so the robot ends where it started (top-left corner).
    cur = { x: next.x, y: next.y };
  }
  return ordered;
}

export function planCutJob(rects: CutRect[], board: BoardSize, home: Point = { x: 0, y: 0 }): CutJobPlan {
  const ordered = orderRects(rects, home);
  const cutH = new Map<number, Interval[]>(); // y -> x-intervals already cut
  const cutV = new Map<number, Interval[]>(); // x -> y-intervals already cut
  const raw: RawStep[] = [];
  let cur: Point = { ...home };

  const moveTo = (pieceId: string, tx: number, ty: number) => {
    if (cur.x !== tx) {
      raw.push({ kind: 'travel', pieceId, x1: cur.x, y1: cur.y, x2: tx, y2: cur.y });
      cur = { x: tx, y: cur.y };
    }
    if (cur.y !== ty) {
      raw.push({ kind: 'travel', pieceId, x1: cur.x, y1: cur.y, x2: cur.x, y2: ty });
      cur = { x: cur.x, y: ty };
    }
  };

  const cutEdge = (pieceId: string, horizontal: boolean, fixed: number, from: number, to: number) => {
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    const map = horizontal ? cutH : cutV;
    const existing = map.get(fixed) ?? [];
    const parts = subtract([lo, hi], existing);
    if (from > to) parts.reverse();
    for (const [s, e] of parts) {
      const a = from <= to ? s : e;
      const b = from <= to ? e : s;
      const sx = horizontal ? a : fixed;
      const sy = horizontal ? fixed : a;
      const ex = horizontal ? b : fixed;
      const ey = horizontal ? fixed : b;
      moveTo(pieceId, sx, sy);
      raw.push({ kind: 'cut', pieceId, x1: sx, y1: sy, x2: ex, y2: ey });
      cur = { x: ex, y: ey };
      existing.push([s, e]);
    }
    map.set(fixed, existing);
  };

  for (const r of ordered) {
    // Clockwise loop starting at the top-left corner: top, right, bottom, left.
    cutEdge(r.id, true, r.y, r.x, r.x + r.w);
    cutEdge(r.id, false, r.x + r.w, r.y, r.y + r.h);
    cutEdge(r.id, true, r.y + r.h, r.x + r.w, r.x);
    cutEdge(r.id, false, r.x, r.y + r.h, r.y);
  }

  // Insert explicit turn steps (torch off) whenever the heading changes.
  const steps: PathStep[] = [];
  let dist = 0;
  let prevHeading: number | null = null;
  const push = (s: Omit<PathStep, 'index' | 'startDist' | 'endDist'>) => {
    steps.push({ ...s, index: steps.length, startDist: dist, endDist: dist + s.length });
    dist += s.length;
  };
  for (const s of raw) {
    const dx = s.x2 - s.x1;
    const dy = s.y2 - s.y1;
    const heading = headingOf(dx, dy);
    if (prevHeading !== null) {
      const diff = normalizeAngle(heading - prevHeading);
      if (Math.abs(diff) > 1e-6) {
        push({
          kind: 'turn',
          pieceId: s.pieceId,
          x1: s.x1,
          y1: s.y1,
          x2: s.x1,
          y2: s.y1,
          length: (Math.abs(diff) / (Math.PI / 2)) * TURN_COST_PER_QUARTER,
          heading1: prevHeading,
          heading2: prevHeading + diff,
        });
      }
    }
    push({
      kind: s.kind,
      pieceId: s.pieceId,
      x1: s.x1,
      y1: s.y1,
      x2: s.x2,
      y2: s.y2,
      length: Math.abs(dx) + Math.abs(dy),
      heading1: heading,
      heading2: heading,
    });
    prevHeading = heading;
  }

  const pieces: PlannedPiece[] = ordered.map((rect, order) => {
    let releaseStep = -1;
    for (const s of steps) {
      if (s.kind !== 'cut') continue;
      if (touchesOutline(s, rect)) releaseStep = Math.max(releaseStep, s.index);
    }
    return { rect, order, releaseStep, releaseDist: releaseStep >= 0 ? steps[releaseStep].endDist : Infinity };
  });

  const cutSteps = steps.filter((s) => s.kind === 'cut');
  return {
    board,
    steps,
    pieces,
    totalLength: dist,
    cutLength: cutSteps.reduce((sum, s) => sum + s.length, 0),
    travelLength: steps.filter((s) => s.kind === 'travel').reduce((sum, s) => sum + s.length, 0),
    cutCount: cutSteps.length,
    turnCount: steps.filter((s) => s.kind === 'turn').length,
  };
}

function overlapLen(a1: number, a2: number, b1: number, b2: number): number {
  return Math.min(Math.max(a1, a2), Math.max(b1, b2)) - Math.max(Math.min(a1, a2), Math.min(b1, b2));
}

/** Whether a (straight) cut step lies along any of the rectangle's four edges. */
function touchesOutline(s: PathStep, r: RawRect): boolean {
  if (s.y1 === s.y2) {
    if (s.y1 !== r.y && s.y1 !== r.y + r.h) return false;
    return overlapLen(s.x1, s.x2, r.x, r.x + r.w) > 0;
  }
  if (s.x1 === s.x2) {
    if (s.x1 !== r.x && s.x1 !== r.x + r.w) return false;
    return overlapLen(s.y1, s.y2, r.y, r.y + r.h) > 0;
  }
  return false;
}

/** Every cut step must be a single straight horizontal or vertical segment. */
export function isStraightAxisAligned(s: PathStep): boolean {
  return (s.x1 === s.x2) !== (s.y1 === s.y2) && s.length > 0;
}

/** Total length of every rectangle edge portion covered by cut steps (used for coverage checks). */
export function coveredEdgeLength(plan: CutJobPlan, rect: RawRect): number {
  const edges: Array<{ horizontal: boolean; fixed: number; lo: number; hi: number }> = [
    { horizontal: true, fixed: rect.y, lo: rect.x, hi: rect.x + rect.w },
    { horizontal: true, fixed: rect.y + rect.h, lo: rect.x, hi: rect.x + rect.w },
    { horizontal: false, fixed: rect.x, lo: rect.y, hi: rect.y + rect.h },
    { horizontal: false, fixed: rect.x + rect.w, lo: rect.y, hi: rect.y + rect.h },
  ];
  let covered = 0;
  for (const e of edges) {
    const ivs: Interval[] = [];
    for (const s of plan.steps) {
      if (s.kind !== 'cut') continue;
      if (e.horizontal && s.y1 === s.y2 && s.y1 === e.fixed) ivs.push([Math.min(s.x1, s.x2), Math.max(s.x1, s.x2)]);
      if (!e.horizontal && s.x1 === s.x2 && s.x1 === e.fixed) ivs.push([Math.min(s.y1, s.y2), Math.max(s.y1, s.y2)]);
    }
    const uncovered = subtract([e.lo, e.hi], ivs).reduce((sum, [a, b]) => sum + (b - a), 0);
    covered += e.hi - e.lo - uncovered;
  }
  return covered;
}

export function distanceForProgress(plan: CutJobPlan, progressPercent: number): number {
  return (Math.max(0, Math.min(100, progressPercent)) / 100) * plan.totalLength;
}

/** Robot pose at a given travelled distance along the path. */
export function poseAtDistance(plan: CutJobPlan, dist: number): RobotPose {
  const steps = plan.steps;
  if (steps.length === 0) return { x: 0, y: 0, heading: 0, torchOn: false, kind: 'idle', stepIndex: 0, pieceId: null };
  if (dist <= 0) {
    const s = steps[0];
    return { x: s.x1, y: s.y1, heading: s.heading1, torchOn: false, kind: 'idle', stepIndex: 0, pieceId: s.pieceId };
  }
  if (dist >= plan.totalLength) {
    const s = steps[steps.length - 1];
    return { x: s.x2, y: s.y2, heading: s.heading2, torchOn: false, kind: 'done', stepIndex: s.index, pieceId: s.pieceId };
  }
  // Binary search for the active step.
  let lo = 0;
  let hi = steps.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (steps[mid].endDist < dist) lo = mid + 1;
    else hi = mid;
  }
  const s = steps[lo];
  const t = s.length === 0 ? 1 : (dist - s.startDist) / s.length;
  return {
    x: s.x1 + (s.x2 - s.x1) * t,
    y: s.y1 + (s.y2 - s.y1) * t,
    heading: s.heading1 + (s.heading2 - s.heading1) * t,
    torchOn: s.kind === 'cut',
    kind: s.kind,
    stepIndex: s.index,
    pieceId: s.pieceId,
  };
}
