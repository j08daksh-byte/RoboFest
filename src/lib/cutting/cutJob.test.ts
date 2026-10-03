import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BOARD_WIDTH, boardHeightFor, rectsFromRaw, snapRect, validateRect, validateLayout, rectsOverlap } from './rectLayout';
import { planCutJob, isStraightAxisAligned, coveredEdgeLength, poseAtDistance } from './cutPath';
import { detectMarkedRects, rgbToHex } from './imageMarks';
import { createBody, releaseBody, stepBody, bodyCorners, footprintOf } from './cutSim';
import type { FallParams, LandedFootprint } from './cutSim';

const board = { width: BOARD_WIDTH, height: 56 };

describe('rect layout', () => {
  it('snaps dragged rectangles in any direction and clamps to the board', () => {
    const r = snapRect({ x: 30.4, y: 20.6, w: -10.2, h: -5.1 }, board);
    assert.deepStrictEqual(r, { x: 20, y: 16, w: 10, h: 5 });
    assert.deepStrictEqual(snapRect({ x: -5, y: -5, w: 200, h: 200 }, board), { x: 0, y: 0, w: 100, h: 56 });
  });

  it('rejects tiny, out-of-board and overlapping rectangles but allows edge sharing', () => {
    const a = { x: 10, y: 10, w: 10, h: 10 };
    assert.strictEqual(validateRect({ x: 0, y: 0, w: 1, h: 10 }, [], board).ok, false);
    assert.strictEqual(validateRect({ x: 95, y: 0, w: 10, h: 10 }, [], board).ok, false);
    assert.strictEqual(validateRect({ x: 15, y: 15, w: 10, h: 10 }, [a], board).ok, false);
    assert.strictEqual(validateRect({ x: 20, y: 10, w: 10, h: 10 }, [a], board).ok, true);
    assert.strictEqual(rectsOverlap(a, { x: 20, y: 10, w: 5, h: 5 }), false);
    assert.strictEqual(validateLayout([], board).ok, false);
  });

  it('derives board height from the photo aspect ratio', () => {
    assert.strictEqual(boardHeightFor(1376, 768), 56);
  });
});

describe('cut path planning', () => {
  const rects = rectsFromRaw([
    { x: 69, y: 17, w: 18, h: 9 },
    { x: 47, y: 37, w: 31, h: 5 },
    { x: 18, y: 34, w: 7, h: 6 },
    { x: 25, y: 34, w: 10, h: 6 }, // shares an edge with the previous piece
  ]);
  const plan = planCutJob(rects, board);

  it('only cuts straight axis-aligned lines', () => {
    for (const s of plan.steps.filter((x) => x.kind === 'cut')) assert.ok(isStraightAxisAligned(s));
  });

  it('never cuts while turning or travelling', () => {
    for (const s of plan.steps) {
      const pose = poseAtDistance(plan, (s.startDist + s.endDist) / 2);
      assert.strictEqual(pose.torchOn, s.kind === 'cut');
    }
    assert.ok(plan.turnCount > 0);
    for (const s of plan.steps.filter((x) => x.kind === 'turn')) {
      assert.strictEqual(s.x1, s.x2);
      assert.strictEqual(s.y1, s.y2);
    }
  });

  it('is continuous: every step starts where the previous one ended', () => {
    for (let i = 1; i < plan.steps.length; i++) {
      assert.strictEqual(plan.steps[i].x1, plan.steps[i - 1].x2);
      assert.strictEqual(plan.steps[i].y1, plan.steps[i - 1].y2);
    }
  });

  it('cuts every edge of every piece exactly once (shared edges only once)', () => {
    for (const r of rects) {
      const expected = 2 * (r.w + r.h);
      assert.strictEqual(coveredEdgeLength(plan, r), expected);
    }
    const perimeter = rects.reduce((sum, r) => sum + 2 * (r.w + r.h), 0);
    assert.strictEqual(plan.cutLength, perimeter - 6); // the shared 6-unit edge is cut only once
  });

  it('assigns each piece a release distance inside the path and releases it only after its outline is cut', () => {
    for (const p of plan.pieces) {
      assert.ok(p.releaseDist > 0 && p.releaseDist <= plan.totalLength);
      assert.strictEqual(plan.steps[p.releaseStep].kind, 'cut');
    }
    const order = [...plan.pieces].sort((a, b) => a.releaseDist - b.releaseDist).map((p) => p.rect.id);
    assert.strictEqual(new Set(order).size, rects.length);
  });
});

function paint(w: number, h: number, boxes: Array<{ x: number; y: number; w: number; h: number; rgb: [number, number, number]; hollow?: number }>) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = 150;
    data[i * 4 + 1] = 190;
    data[i * 4 + 2] = 220;
    data[i * 4 + 3] = 255;
  }
  for (const b of boxes) {
    for (let y = b.y; y < b.y + b.h; y++) {
      for (let x = b.x; x < b.x + b.w; x++) {
        if (b.hollow && x >= b.x + b.hollow && x < b.x + b.w - b.hollow && y >= b.y + b.hollow && y < b.y + b.h - b.hollow) continue;
        const i = (y * w + x) * 4;
        data[i] = b.rgb[0];
        data[i + 1] = b.rgb[1];
        data[i + 2] = b.rgb[2];
      }
    }
  }
  return data;
}

describe('marked photo detection', () => {
  const W = 400;
  const H = 224; // 100 x 56 board, 4 px per cell

  it('finds filled magenta rectangles automatically', () => {
    const data = paint(W, H, [
      { x: 80, y: 40, w: 120, h: 60, rgb: [255, 0, 255] },
      { x: 240, y: 120, w: 100, h: 40, rgb: [255, 0, 255] },
    ]);
    const res = detectMarkedRects(data, W, H, { board });
    assert.strictEqual(rgbToHex(res.marker!), '#ff00ff');
    assert.deepStrictEqual(res.rects.sort((a, b) => a.x - b.x), [
      { x: 20, y: 10, w: 30, h: 15 },
      { x: 60, y: 30, w: 25, h: 10 },
    ]);
  });

  it('fills hollow outlines drawn with a marker pen', () => {
    const data = paint(W, H, [{ x: 100, y: 60, w: 160, h: 80, rgb: [255, 0, 0], hollow: 4 }]);
    const res = detectMarkedRects(data, W, H, { board, target: { r: 255, g: 0, b: 0 } });
    assert.strictEqual(res.rects.length, 1);
    const r = res.rects[0];
    assert.ok(Math.abs(r.x - 25) <= 1 && Math.abs(r.y - 15) <= 1 && Math.abs(r.w - 40) <= 2 && Math.abs(r.h - 20) <= 2, JSON.stringify(r));
  });

  it('splits an L shaped mark into non-overlapping rectangles', () => {
    const data = paint(W, H, [
      { x: 80, y: 40, w: 160, h: 40, rgb: [0, 255, 0] },
      { x: 80, y: 80, w: 40, h: 80, rgb: [0, 255, 0] },
    ]);
    const res = detectMarkedRects(data, W, H, { board });
    assert.ok(res.rects.length >= 2);
    for (let i = 0; i < res.rects.length; i++) for (let j = i + 1; j < res.rects.length; j++) assert.ok(!rectsOverlap(res.rects[i], res.rects[j]));
    const area = res.rects.reduce((s, r) => s + r.w * r.h, 0);
    assert.strictEqual(area, 40 * 10 + 10 * 20);
  });

  it('reports when nothing is marked', () => {
    const data = paint(W, H, []);
    const res = detectMarkedRects(data, W, H, { board });
    assert.strictEqual(res.rects.length, 0);
  });
});

describe('falling piece physics', () => {
  const scale = 0.1;
  const params: FallParams = { h: 9 * scale, t: 0.15, width: 18 * scale, cx: 0, cy0: 2.5, cz0: 0 };

  function simulate(landed: LandedFootprint[] = []) {
    const body = createBody(params);
    releaseBody(body);
    let t = 0;
    while (body.phase !== 'rest' && t < 12) {
      stepBody(body, params, 1 / 60, { floorY: 0, landed });
      t += 1 / 60;
    }
    return { body, t };
  }

  it('topples outward, falls and comes to rest flat on the floor', () => {
    const { body, t } = simulate();
    assert.strictEqual(body.phase, 'rest', `still moving after ${t}s`);
    const corners = bodyCorners(body, params);
    const lowest = Math.min(...corners.map((c) => c.y));
    assert.ok(Math.abs(lowest) < 0.02, `lowest corner at ${lowest}`);
    const flat = Math.abs(Math.sin(body.theta));
    assert.ok(flat > 0.999, 'plate is lying flat');
    assert.ok(body.cz > 0.2, 'plate landed in front of the hull, not inside it');
    assert.ok(Math.abs(body.cy - params.t / 2) < 0.02);
  });

  it('never sinks through the floor while falling', () => {
    const body = createBody(params);
    releaseBody(body);
    for (let i = 0; i < 60 * 10; i++) {
      stepBody(body, params, 1 / 60, { floorY: 0, landed: [] });
      const lowest = Math.min(...bodyCorners(body, params).map((c) => c.y));
      assert.ok(lowest > -0.02, `penetration ${lowest}`);
    }
  });

  it('stacks on a piece that already landed', () => {
    const first = simulate();
    const foot = footprintOf(first.body, params);
    const second = simulate([foot]);
    assert.strictEqual(second.body.phase, 'rest');
    for (const c of bodyCorners(second.body, params)) {
      if (c.z > foot.zMin && c.z < foot.zMax) assert.ok(c.y >= foot.topY - 0.03, `corner at z=${c.z} sank to y=${c.y} inside landed piece (top ${foot.topY})`);
    }
  });
});
