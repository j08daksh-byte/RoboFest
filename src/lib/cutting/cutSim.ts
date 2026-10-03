/**
 * Falling plate physics (2D rigid body in the vertical y-z plane).
 *
 * A cut piece is a rectangle h (tall) x t (thick). When the last edge is cut it is first held by the
 * lower lip of the hole and topples outward about its bottom front edge. Once the lean angle is large
 * enough it slips off the lip and falls freely, bouncing on the floor (or on pieces that landed earlier)
 * with restitution and friction until it comes to rest.
 *
 * Coordinates: y up, z points away from the hull (towards the viewer). Rotation angle theta is about +x:
 *   y' = y cos(theta) - z sin(theta),  z' = y sin(theta) + z cos(theta)
 * which matches three.js `rotation.x`.
 */

export const GRAVITY = 9.81;

export type BodyPhase = 'attached' | 'tip' | 'free' | 'rest';

export interface FallParams {
  /** Plate height (m). */
  h: number;
  /** Plate thickness (m). */
  t: number;
  /** Plate width along x (m), used for stacking footprints. */
  width: number;
  /** Plate centre x (m). */
  cx: number;
  /** Initial centre height (m). */
  cy0: number;
  /** Initial centre z (m). */
  cz0: number;
}

export interface FallBody {
  phase: BodyPhase;
  theta: number;
  omega: number;
  cy: number;
  cz: number;
  vy: number;
  vz: number;
  restTimer: number;
}

export interface LandedFootprint {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  topY: number;
}

export interface FloorQuery {
  floorY: number;
  landed: LandedFootprint[];
}

/** Angle (rad) at which a toppling plate slips off the lip of the hole. */
export const SLIP_ANGLE = (50 * Math.PI) / 180;
const KICK_OMEGA = 1.1;
const RESTITUTION = 0.28;
const FRICTION = 0.55;
const ANGULAR_DAMPING = 0.15;
const MAX_SUBSTEP = 1 / 240;

export function createBody(p: FallParams): FallBody {
  return { phase: 'attached', theta: 0, omega: 0, cy: p.cy0, cz: p.cz0, vy: 0, vz: 0, restTimer: 0 };
}

export function releaseBody(b: FallBody): void {
  if (b.phase !== 'attached') return;
  b.phase = 'tip';
  b.omega = KICK_OMEGA;
}

function rotate(ly: number, lz: number, theta: number) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return { y: ly * c - lz * s, z: ly * s + lz * c };
}

export function bodyCorners(b: FallBody, p: FallParams): Array<{ y: number; z: number; ry: number; rz: number }> {
  const out: Array<{ y: number; z: number; ry: number; rz: number }> = [];
  for (const ly of [-p.h / 2, p.h / 2]) {
    for (const lz of [-p.t / 2, p.t / 2]) {
      const r = rotate(ly, lz, b.theta);
      out.push({ y: b.cy + r.y, z: b.cz + r.z, ry: r.y, rz: r.z });
    }
  }
  return out;
}

function surfaceAt(z: number, x: { min: number; max: number }, q: FloorQuery): number {
  let y = q.floorY;
  for (const l of q.landed) {
    if (x.max <= l.xMin || x.min >= l.xMax) continue;
    if (z >= l.zMin && z <= l.zMax && l.topY > y) y = l.topY;
  }
  return y;
}

function stepTip(b: FallBody, p: FallParams, dt: number): void {
  // Pivot: bottom front edge of the plate (local offset).
  const plY = -p.h / 2;
  const plZ = p.t / 2;
  const pivot = (() => {
    const r = rotate(plY, plZ, b.theta);
    return { y: b.cy - r.y, z: b.cz - r.z };
  })();
  // Centre of mass relative to the pivot.
  const rc = rotate(-plY, -plZ, b.theta);
  const inertia = (p.h * p.h + p.t * p.t) / 12 + (plY * plY + plZ * plZ);
  const torque = rc.z * GRAVITY; // m = 1, force (0, -g): torque_x = ry*Fz - rz*Fy = rz*g
  const alpha = torque / inertia;
  b.omega += alpha * dt;
  b.theta += b.omega * dt;
  if (b.theta < 0) {
    // It cannot swing back into the hole.
    b.theta = 0;
    b.omega = Math.max(0, b.omega);
  }
  const r2 = rotate(-plY, -plZ, b.theta);
  b.cy = pivot.y + r2.y;
  b.cz = pivot.z + r2.z;
  if (b.theta >= SLIP_ANGLE) {
    // Slip off the lip: keep the velocity of the centre of mass.
    b.vy = -b.omega * r2.z;
    b.vz = b.omega * r2.y;
    b.phase = 'free';
  }
}

function stepFree(b: FallBody, p: FallParams, dt: number, q: FloorQuery): void {
  b.vy -= GRAVITY * dt;
  b.omega *= 1 - ANGULAR_DAMPING * dt;
  b.cy += b.vy * dt;
  b.cz += b.vz * dt;
  b.theta += b.omega * dt;
  const inertia = (p.h * p.h + p.t * p.t) / 12;
  const xr = { min: p.cx - p.width / 2, max: p.cx + p.width / 2 };

  for (let iter = 0; iter < 4; iter++) {
    let deepest = 0;
    for (const c of bodyCorners(b, p)) {
      const floor = surfaceAt(c.z, xr, q);
      const pen = floor - c.y;
      if (pen <= 0) continue;
      deepest = Math.max(deepest, pen);
      const vcy = b.vy - b.omega * c.rz;
      if (vcy >= 0) continue;
      const e = -vcy < 0.6 ? 0 : RESTITUTION;
      const j = (-(1 + e) * vcy) / (1 + (c.rz * c.rz) / inertia);
      b.vy += j;
      b.omega += (-c.rz * j) / inertia;
      const vcz = b.vz + b.omega * c.ry;
      let jt = -vcz / (1 + (c.ry * c.ry) / inertia);
      const limit = FRICTION * j;
      jt = Math.max(-limit, Math.min(limit, jt));
      b.vz += jt;
      b.omega += (c.ry * jt) / inertia;
    }
    if (deepest > 0) b.cy += deepest;
  }

  const corners = bodyCorners(b, p);
  const touching = corners.filter((c) => c.y - surfaceAt(c.z, xr, q) < 0.01).length;
  const speed = Math.hypot(b.vy, b.vz);
  if (touching >= 2 && speed < 0.12 && Math.abs(b.omega) < 0.25) {
    b.restTimer += dt;
    if (b.restTimer > 0.25) {
      // Settle: snap to the flat orientation when nearly flat, otherwise keep the leaning pose
      // (e.g. resting with one end on a piece that landed earlier).
      const flat = Math.round((b.theta - Math.PI / 2) / Math.PI) * Math.PI + Math.PI / 2;
      const nearlyFlat = Math.abs(Math.sin(b.theta - flat)) < 0.1;
      if (nearlyFlat) b.theta = flat;
      b.omega = 0;
      b.vy = 0;
      b.vz = 0;
      if (nearlyFlat) {
        const snapped = bodyCorners(b, p);
        const base = Math.max(...snapped.map((c) => surfaceAt(c.z, xr, q)));
        const lowest = Math.min(...snapped.map((c) => c.y));
        b.cy += base - lowest;
      }
      b.phase = 'rest';
    }
  } else {
    b.restTimer = 0;
  }
}

/** Advances the body by dt seconds (sub-stepped for stability). */
export function stepBody(b: FallBody, p: FallParams, dt: number, q: FloorQuery): void {
  if (b.phase === 'attached' || b.phase === 'rest') return;
  let remaining = dt;
  while (remaining > 1e-9 && (b.phase as BodyPhase) !== 'rest') {
    const h = Math.min(MAX_SUBSTEP, remaining);
    if (b.phase === 'tip') stepTip(b, p, h);
    else stepFree(b, p, h, q);
    remaining -= h;
  }
}

export function footprintOf(b: FallBody, p: FallParams): LandedFootprint {
  const corners = bodyCorners(b, p);
  const zs = corners.map((c) => c.z);
  const ys = corners.map((c) => c.y);
  return {
    xMin: p.cx - p.width / 2,
    xMax: p.cx + p.width / 2,
    zMin: Math.min(...zs),
    zMax: Math.max(...zs),
    topY: Math.max(...ys),
  };
}
