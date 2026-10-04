"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, OrbitControls, ContactShadows } from '@react-three/drei';
import { usePlatformStore } from '@/lib/platformStore';
import { MissionStatus } from '@/lib/domain';
import { distanceForProgress, poseAtDistance } from '@/lib/cutting/cutPath';
import type { CutJobPlan } from '@/lib/cutting/cutPath';
import { useRobotStore } from '@/lib/robotState';
import { ShipAssembly } from './DigitalTwin/ShipAssembly';
import { ShipHull } from './DigitalTwin/ShipHull';
import { RobotModel } from './DigitalTwin/RobotModel';
import { ProceduralShipSurface } from '@/lib/geometry/ProceduralShipSurface';
import { computeRobotOrientation } from '@/lib/geometry/HullSurfaceQuery';

export type CameraView = 'overview' | 'robot' | 'cut' | 'side';

const VIEW_LABELS: Array<{ id: CameraView; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'robot', label: 'Follow Robot' },
  { id: 'cut', label: 'Target View' },
  { id: 'side', label: 'Side (Watch Drop)' },
];

function CameraRig({ view, controls, robotPos }: { view: CameraView; controls: React.RefObject<any>; robotPos: THREE.Vector3 }) {
  const camera = useThree((s) => s.camera);
  
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    
    const target = new THREE.Vector3(50.25, 10, 37.5);
    
    if (view === 'overview') {
      camera.position.set(20, 20, 80);
      c.target.copy(target);
    } else if (view === 'side') {
      camera.position.set(90, 5, 37.5);
      c.target.copy(target);
    }
    c.update();
  }, [view, controls, camera]);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    const k = 1 - Math.exp(-dt * 3);
    
    if (view === 'robot' || view === 'cut') {
      const targetPos = robotPos.clone();
      if (view === 'robot') {
        const offset = new THREE.Vector3(5, 5, 10);
        camera.position.lerp(targetPos.clone().add(offset), k);
        c.target.lerp(targetPos, k);
      } else if (view === 'cut') {
        const offset = new THREE.Vector3(12, -2, 2);
        camera.position.lerp(targetPos.clone().add(offset), k);
        c.target.lerp(targetPos, k);
      }
      c.update();
    }
  });
  return null;
}

function mapToDigitalTwin(planX: number, planY: number, boardW: number, boardH: number) {
  const u = 1.0 - (planX / boardW);
  const v = 0.5 + ((planY / boardH) * 0.4);
  
  const surface = new ProceduralShipSurface();
  const query = surface.querySurfacePoint(u, v);
  
  const worldPos = new THREE.Vector3(
    50.25 + query.position.x * 5,
    query.position.y * 5,
    37.5 + query.position.z * 5
  );
  
  const quat = computeRobotOrientation(query.normal, query.tangent);
  const euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');
  
  return {
    worldPos,
    roll: euler.z,
    pitch: euler.x,
    yaw: euler.y
  };
}

function CutSimulation3DCore({ 
  plan, 
  resetKey, 
  overrideProgress, 
  setRobotTarget, 
  missionStatus, 
  missionProgress, 
  missionId 
}: { 
  plan: CutJobPlan; 
  resetKey: string; 
  overrideProgress?: number; 
  setRobotTarget: (pos: THREE.Vector3) => void;
  missionStatus: MissionStatus;
  missionProgress: number;
  missionId: string | null;
}) {
  const simState = useRef({ dist: 0, lastPathPts: 0 });

  useEffect(() => {
    useRobotStore.setState({ activeCutPath: [], completedCuts: [] });
    simState.current = { dist: 0, lastPathPts: 0 };
  }, [resetKey]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1/20);
    const total = plan.totalLength;
    let target = 0;
    
    if (overrideProgress !== undefined) {
      target = distanceForProgress(plan, overrideProgress);
    } else {
      target = distanceForProgress(plan, missionProgress);
      if (missionStatus === MissionStatus.COMPLETED) target = total;
      if (!missionId || missionStatus === MissionStatus.ABORTED) target = 0;
    }

    const prevDist = simState.current.dist;
    simState.current.dist += (target - simState.current.dist) * (1 - Math.exp(-dt * 8));
    if (Math.abs(target - simState.current.dist) < 0.05) simState.current.dist = target;
    
    if (simState.current.dist === prevDist && simState.current.dist === 0) return;
    if (plan.steps.length === 0) return;

    const pose = poseAtDistance(plan, simState.current.dist);
    const { worldPos, roll, pitch, yaw } = mapToDigitalTwin(pose.x, pose.y, plan.board.width, plan.board.height);
    
    setRobotTarget(worldPos);

    useRobotStore.setState({
      position: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
      orientation: { roll, pitch, yaw },
      torch: { enabled: pose.torchOn }
    });

    const store = useRobotStore.getState();
    let currentCutPoints: Array<{x: number, y: number}> = [];
    
    if (pose.torchOn) {
      currentCutPoints = [...store.activeCutPath, { x: worldPos.x, y: worldPos.y }];
      useRobotStore.setState({ activeCutPath: currentCutPoints });
    } else if (store.activeCutPath.length > 0) {
      const isClosed = true;
      useRobotStore.setState({
        completedCuts: [...store.completedCuts, {
          id: Math.random().toString(36),
          path: store.activeCutPath,
          isClosed,
          timestamp: new Date().toISOString()
        }],
        activeCutPath: []
      });
    }
  });

  return null;
}

export interface CutSimulation3DProps {
  plan: CutJobPlan;
  imageUrl: string | null;
  resetKey: string;
  statusLabel: string;
  torchOn: boolean;
  overrideProgress?: number;
}

export function CutSimulation3D({ plan, resetKey, statusLabel, overrideProgress }: CutSimulation3DProps) {
  const [view, setView] = useState<CameraView>('overview');
  const controls = useRef<any>(null);
  const [robotTarget, setRobotTarget] = useState(new THREE.Vector3(50.25, 10, 37.5));
  const mission = usePlatformStore(s => s.mission);

  return (
    <div id="cut-3d" style={{ position: 'relative', width: '100%', height: 'min(62vh, 560px)', minHeight: 340, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#10151a' }}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [20, 20, 80], fov: 45 }}>
        <CutSimulation3DCore 
          plan={plan} 
          resetKey={resetKey} 
          overrideProgress={overrideProgress} 
          setRobotTarget={setRobotTarget} 
          missionStatus={mission.status}
          missionProgress={mission.progressPercentage}
          missionId={mission.id}
        />
        <color attach="background" args={['#10151a']} />
        <fog attach="fog" args={['#10151a', 100, 400]} />
        
        <ambientLight intensity={0.4} color="#a0b0c0" />
        <directionalLight position={[40, 50, 40]} intensity={1.5} castShadow color="#fff0dd" />
        
        <CameraRig view={view} controls={controls} robotPos={robotTarget} />
        <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2 - 0.05} />

        <group position={[50.25, 0, 37.5]} rotation={[0, Math.PI / 2, 0]}>
          <group scale={[5, 5, 5]}>
             <ShipHull />
          </group>
          <RobotModel showAxes={false} />
        </group>
        <group scale={[5, 5, 5]}>
          <ShipAssembly />
        </group>
        <ContactShadows resolution={1024} scale={200} blur={2.5} opacity={0.6} far={2} position={[0, -29.9, 0]} />
        <Grid position={[0, -29.9, 0]} args={[500, 500]} cellColor="#666" sectionColor="#333" fadeDistance={200} />
      </Canvas>

      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {VIEW_LABELS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              padding: '4px 9px', fontSize: '0.7rem', cursor: 'pointer', borderRadius: 4,
              border: `1px solid ${view === v.id ? 'var(--accent)' : 'rgba(255,255,255,0.15)'}`,
              background: view === v.id ? 'rgba(56,189,248,0.25)' : 'rgba(8,12,16,0.7)', color: 'var(--text-main)',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div id="cut-3d-status" style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: 'rgba(8,12,16,0.78)', borderRadius: 4, fontSize: '0.72rem', color: 'var(--text-main)' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: mission.status === MissionStatus.RUNNING ? '#ff5a1a' : '#64748b', boxShadow: mission.status === MissionStatus.RUNNING ? '0 0 8px #ff5a1a' : 'none' }} />
        <strong>DIGITAL TWIN</strong>
        <span style={{ color: 'var(--text-secondary)' }}>{statusLabel}</span>
      </div>
    </div>
  );
}
