"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { EventCategory, MissionStatus } from '@/lib/domain';
import { useCutJobStore } from '@/lib/cutting/cutJobStore';
import type { SimSpeed } from '@/lib/cutting/cutJobStore';
import { distanceForProgress, planCutJob, poseAtDistance } from '@/lib/cutting/cutPath';
import { layoutSignature } from '@/lib/cutting/rectLayout';
import { CutSimulation3D } from './CutSimulation3D';

const TICK_MS = 100;
/** Grid units travelled per tick at 1x (a 100 unit wide plate is 10 m, so 1x is 1 m/s). */
const UNITS_PER_TICK = 1;

const SPEEDS: SimSpeed[] = [1, 2, 4];

export function ShipCutPanel() {
  const { mission, safety, setMissionProgress, completeMission, interruptMission, addSystemEvent, recordCutsCompleted } =
    usePlatformStore();
  const { rects, board, imageUrl, speed, setSpeed, setRects } = useCutJobStore();

  useEffect(() => {
    if (!!mission.id) {
      fetch(`/api/missions/${mission.id}/cuts`)
        .then(res => res.json())
        .then(data => {
          if (data.data && data.data.length > 0) {
             const loadedRects = data.data.map((cut: any) => JSON.parse(cut.normalizedJson));
             setRects(loadedRects);
          }
        })
        .catch(console.error);
    }
  }, [mission.id]);

  const plan = useMemo(() => planCutJob(rects, board), [rects, board]);
  const lastStep = useRef<number>(-1);
  const releasedPieces = useRef<Set<string>>(new Set());
  const running = mission.status === MissionStatus.RUNNING;
  const finished = mission.status === MissionStatus.COMPLETED;
  const hasMission = !!mission.id;
  const progress = mission.progressPercentage;
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const [previewProgress, setPreviewProgress] = useState(0);

  useEffect(() => {
    if (running || finished || plan.steps.length === 0) return;
    let frame: number;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPreviewProgress(p => {
        const unitsPerSec = (1000 / TICK_MS) * UNITS_PER_TICK * speedRef.current;
        const next = p + (unitsPerSec / plan.totalLength) * 100 * dt;
        if (next > 115) return 0; // Pause at the end before looping
        return next;
      });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running, finished, plan]);

  const effectiveProgress = running ? progress : (finished ? 100 : Math.min(100, previewProgress));
  const dist = distanceForProgress(plan, effectiveProgress);
  const pose = poseAtDistance(plan, dist);
  const releasedCount = plan.pieces.filter((p) => dist >= p.releaseDist - 1e-6).length;

  useEffect(() => {
    if (!running || plan.steps.length === 0) return;
    const emit = (message: string, severity: 'INFO' | 'WARNING' = 'INFO') =>
      addSystemEvent({
        id: 'EV-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toISOString(),
        category: EventCategory.MISSION,
        message,
        severity,
        missionId: usePlatformStore.getState().mission.id ?? undefined,
        source: 'SHIP_CUT_PLAN',
      });

    const timer = setInterval(() => {
      const state = usePlatformStore.getState();
      if (state.mission.status !== MissionStatus.RUNNING) return;

      // Safety gate: never keep cutting without permission.
      if (!state.safety.torchPermission || !state.safety.movementPermission || state.safety.emergencyStateActive) {
        interruptMission();
        emit('Cutting paused: safety permission denied.', 'WARNING');
        return;
      }

      const next = Math.min(100, state.mission.progressPercentage + ((UNITS_PER_TICK * speedRef.current) / plan.totalLength) * 100);
      const nextDist = distanceForProgress(plan, next);
      const pos = poseAtDistance(plan, nextDist);

      if (pos.stepIndex !== lastStep.current) {
        lastStep.current = pos.stepIndex;
        const s = plan.steps[pos.stepIndex];
        if (s.kind === 'cut') {
          emit(`${s.pieceId}: torch ON, straight ${s.y1 === s.y2 ? 'horizontal' : 'vertical'} cut, ${s.length} units`);
        } else if (s.kind === 'turn') {
          emit(`${s.pieceId}: robot turning, torch OFF`);
        } else {
          emit(`Moving to ${s.pieceId}, torch OFF (${s.length} units straight)`);
        }
      }
      for (const p of plan.pieces) {
        if (!releasedPieces.current.has(p.rect.id) && nextDist >= p.releaseDist - 1e-6) {
          releasedPieces.current.add(p.rect.id);
          emit(`${p.rect.id} cut free on all sides and dropped (${p.rect.w}x${p.rect.h} units)`);
        }
      }

      if (next >= 100) {
        setMissionProgress(99.99);
        completeMission();
        recordCutsCompleted(plan.cutCount, plan.pieces.length);
        emit('Ship cutting complete. All marked pieces separated.');
      } else {
        setMissionProgress(next);
      }
    }, TICK_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, plan]);

  useEffect(() => {
    if (mission.status === MissionStatus.DRAFT || mission.status === MissionStatus.READY || mission.status === MissionStatus.ABORTED) {
      lastStep.current = -1;
      releasedPieces.current = new Set();
    }
  }, [mission.status, mission.id]);

  let statusLabel = 'Ready. Create a mission and press Start.';
  if (!hasMission) statusLabel = 'Previewing cut path. Create a mission when ready.';
  else if (finished) statusLabel = 'Cutting complete.';
  else if ((mission.status === MissionStatus.DRAFT || mission.status === MissionStatus.READY) && progress === 0) statusLabel = 'Mission planned. Press Start to execute on real robot.';
  else if (mission.status === MissionStatus.PAUSED) statusLabel = 'Paused.';
  
  if (!running && !finished && previewProgress <= 100) {
    if (pose.kind === 'cut') statusLabel = `[PREVIEW] Cutting ${pose.pieceId} in a straight line`;
    else if (pose.kind === 'turn') statusLabel = `[PREVIEW] Turning (no cutting) at ${pose.pieceId}`;
    else if (pose.kind === 'travel') statusLabel = `[PREVIEW] Moving straight to ${pose.pieceId}`;
  } else if (running) {
    if (pose.kind === 'cut') statusLabel = `Cutting ${pose.pieceId} in a straight line`;
    else if (pose.kind === 'turn') statusLabel = `Turning (no cutting) at ${pose.pieceId}`;
    else if (pose.kind === 'travel') statusLabel = `Moving straight to ${pose.pieceId} (no cutting)`;
  }

  const torchOn = (running || (!finished && previewProgress <= 100)) && pose.torchOn;
  const resetKey = `${layoutSignature(rects, board)}|${mission.id ?? 'none'}|${imageUrl?.length ?? 0}`;

  const stat = (label: string, value: string) => (
    <div className="metric-group">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );

  return (
    <div className="ui-panel">
      <div className="ui-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="heading-technical" style={{ margin: 0, border: 'none' }}>3D CUTTING DIGITAL TWIN</h2>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Speed</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              id={`cut-speed-${s}`}
              onClick={() => setSpeed(s)}
              style={{
                padding: '3px 9px', fontSize: '0.7rem', cursor: 'pointer', borderRadius: 4,
                border: `1px solid ${speed === s ? 'var(--accent)' : 'var(--border-color)'}`,
                background: speed === s ? 'rgba(56,189,248,0.2)' : 'var(--bg-card)', color: 'var(--text-main)',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
      <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-16)' }}>
        <CutSimulation3D plan={plan} imageUrl={imageUrl} resetKey={resetKey} statusLabel={statusLabel} torchOn={torchOn} overrideProgress={effectiveProgress} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--sp-12)' }}>
          {stat('Pieces dropped', `${releasedCount} / ${plan.pieces.length}`)}
          {stat('Straight cuts', `${plan.cutCount}`)}
          {stat('Cut length', `${(plan.cutLength * 0.1).toFixed(1)} m`)}
          {stat('Turns (torch off)', `${plan.turnCount}`)}
          {stat('Travel (torch off)', `${(plan.travelLength * 0.1).toFixed(1)} m`)}
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {!safety.torchPermission && <span style={{ color: 'var(--critical)' }}>Torch blocked by safety. </span>}
          {rects.length === 0 && <span style={{ color: 'var(--warning)' }}>No cut regions yet: upload a photo and mark the parts to cut.</span>}
        </div>
      </div>
    </div>
  );
}
