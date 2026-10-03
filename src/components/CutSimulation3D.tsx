"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import { usePlatformStore } from '@/lib/platformStore';
import { MissionStatus } from '@/lib/domain';
import { distanceForProgress, poseAtDistance } from '@/lib/cutting/cutPath';
import type { CutJobPlan } from '@/lib/cutting/cutPath';
import { wallRuns } from '@/lib/cutting/wallLayout';
import { createBody, footprintOf, releaseBody, stepBody } from '@/lib/cutting/cutSim';
import type { FallBody, FallParams, LandedFootprint } from '@/lib/cutting/cutSim';

/** Metres per board grid unit (the 100 unit wide photo becomes a 10 m wide hull plate). */
const S = 0.1;
/** Hull plate thickness (m). */
const T = 0.15;
/** Height of the bottom of the hull plate above the dock floor (m). */
const ELEV = 2.4;
const KERF = 0.035;
const ROBOT_SCALE = 1.6;
const SPARK_COUNT = 90;

type OrbitControlsImpl = React.ElementRef<typeof OrbitControls>;

export type CameraView = 'angle' | 'front' | 'side' | 'follow';

const VIEW_LABELS: Array<{ id: CameraView; label: string }> = [
  { id: 'angle', label: '3D angle' },
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side (watch the drop)' },
  { id: 'follow', label: 'Follow robot' },
];

function steelTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const grad = g.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#6c7884');
  grad.addColorStop(1, '#4b5560');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i <= 256; i += 64) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 256);
    g.moveTo(0, i);
    g.lineTo(256, i);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function usePhotoTexture(url: string | null): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    let created: THREE.Texture | null = null;
    if (!url) {
      created = steelTexture();
      Promise.resolve().then(() => {
        if (alive) setTex(created);
      });
    } else {
      new THREE.TextureLoader().load(url, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        if (alive) {
          created = t;
          setTex(t);
        } else {
          t.dispose();
        }
      });
    }
    return () => {
      alive = false;
      created?.dispose();
    };
  }, [url]);
  return tex;
}

/** Box whose front/back faces show only the given photo region (u/v in 0..1, v up). */
function texturedBox(w: number, h: number, t: number, u0: number, v0: number, u1: number, v1: number): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, h, t);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 16; i < 24; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  uv.needsUpdate = true;
  return g;
}

interface Sim {
  bodies: FallBody[];
  params: FallParams[];
  registered: boolean[];
  landed: LandedFootprint[];
  dist: number;
  sparks: { pos: Float32Array; vel: Float32Array; life: Float32Array; next: number; acc: number };
}

function createSim(plan: CutJobPlan): Sim {
  const bw = plan.board.width;
  const bh = plan.board.height;
  const params: FallParams[] = plan.pieces.map(({ rect: r }) => ({
    h: r.h * S,
    t: T,
    width: r.w * S,
    cx: (r.x + r.w / 2 - bw / 2) * S,
    cy0: ELEV + (bh - (r.y + r.h / 2)) * S,
    cz0: 0,
  }));
  return {
    bodies: params.map(createBody),
    params,
    registered: params.map(() => false),
    landed: [],
    dist: 0,
    sparks: {
      pos: new Float32Array(SPARK_COUNT * 3),
      vel: new Float32Array(SPARK_COUNT * 3),
      life: new Float32Array(SPARK_COUNT),
      next: 0,
      acc: 0,
    },
  };
}

function shortestAngle(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

interface SceneProps {
  plan: CutJobPlan;
  texture: THREE.Texture;
  view: CameraView;
  overrideProgress?: number;
}

function CameraRig({ view, controls, robotPos, center }: { view: CameraView; controls: React.RefObject<OrbitControlsImpl | null>; robotPos: THREE.Vector3; center: THREE.Vector3 }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const c = controls.current;
    if (!c || view === 'follow') return;
    const presets: Record<Exclude<CameraView, 'follow'>, { pos: [number, number, number]; target: [number, number, number] }> = {
      angle: { pos: [center.x + 6.5, center.y + 2.8, 13.5], target: [center.x, center.y - 1.2, 0.8] },
      front: { pos: [center.x, center.y + 0.4, 15.5], target: [center.x, center.y - 0.6, 0] },
      side: { pos: [center.x + 14, 3.2, 2.6], target: [center.x, 2.2, 1.4] },
    };
    const p = presets[view];
    camera.position.set(...p.pos);
    c.target.set(...p.target);
    c.update();
  }, [view, controls, camera, center]);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c || view !== 'follow') return;
    const k = 1 - Math.exp(-dt * 3);
    camera.position.lerp(new THREE.Vector3(robotPos.x + 1.8, robotPos.y + 0.9, 3.6), k);
    c.target.lerp(robotPos, k);
    c.update();
  });
  return null;
}

function CutScene({ plan, texture, view, overrideProgress }: SceneProps) {
  const bw = plan.board.width;
  const bh = plan.board.height;
  const W = bw * S;
  const H = bh * S;
  const rects = useMemo(() => plan.pieces.map((p) => p.rect), [plan]);
  const pieceParams = useMemo(() => plan.pieces.map(({ rect: r }) => ({
    cx: (r.x + r.w / 2 - bw / 2) * S,
    cy0: ELEV + (bh - (r.y + r.h / 2)) * S,
  })), [plan.pieces, bw, bh]);

  const simRef = useRef<Sim | null>(null);
  useEffect(() => {
    simRef.current = createSim(plan);
  }, [plan]);
  const center = useMemo(() => new THREE.Vector3(0, ELEV + H / 2, 0), [H]);
  const robotPos = useMemo(() => new THREE.Vector3(0, ELEV + H, T), [H]);
  const controls = useRef<OrbitControlsImpl | null>(null);

  const gx = (x: number) => (x - bw / 2) * S;
  const gy = (y: number) => ELEV + (bh - y) * S;

  const mats = useMemo(() => {
    const steel = new THREE.MeshStandardMaterial({ color: '#59636d', metalness: 0.7, roughness: 0.45 });
    const front = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.1, roughness: 0.6 });
    const back = new THREE.MeshStandardMaterial({ map: texture, color: '#9aa3ad', metalness: 0.2, roughness: 0.7 });
    return { steel, front, back, array: [steel, steel, steel, steel, front, back] };
  }, [texture]);

  const runGeos = useMemo(
    () =>
      wallRuns(rects, plan.board).map((r) => ({
        key: `${r.x0}-${r.y0}-${r.x1}-${r.y1}`,
        pos: [gx((r.x0 + r.x1) / 2), gy((r.y0 + r.y1) / 2), 0] as [number, number, number],
        geo: texturedBox((r.x1 - r.x0) * S, (r.y1 - r.y0) * S, T, r.x0 / bw, 1 - r.y1 / bh, r.x1 / bw, 1 - r.y0 / bh),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rects, plan.board, bw, bh],
  );

  const pieceGeos = useMemo(
    () => rects.map((r) => texturedBox(r.w * S, r.h * S, T, r.x / bw, 1 - (r.y + r.h) / bh, (r.x + r.w) / bw, 1 - r.y / bh)),
    [rects, bw, bh],
  );

  useEffect(() => () => {
    runGeos.forEach((r) => r.geo.dispose());
    pieceGeos.forEach((g) => g.dispose());
  }, [runGeos, pieceGeos]);

  useEffect(() => () => {
    mats.steel.dispose();
    mats.front.dispose();
    mats.back.dispose();
  }, [mats]);

  const cutSteps = useMemo(() => plan.steps.filter((s) => s.kind === 'cut'), [plan]);
  const kerfRefs = useRef<Array<THREE.Mesh | null>>([]);
  const pieceRefs = useRef<Array<THREE.Group | null>>([]);
  const robotRef = useRef<THREE.Group>(null);
  const torchLight = useRef<THREE.PointLight>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const sparkRef = useRef<THREE.InstancedMesh>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, rawDt) => {
    const sim = simRef.current;
    if (!sim) return;
    const dt = Math.min(rawDt, 1 / 20);
    const mission = usePlatformStore.getState().mission;
    const total = plan.totalLength;

    let target = 0;
    if (overrideProgress !== undefined) {
      target = distanceForProgress(plan, overrideProgress);
    } else {
      target = distanceForProgress(plan, mission.progressPercentage);
      if (mission.status === MissionStatus.COMPLETED) target = total;
      if (!mission.id || mission.status === MissionStatus.CANCELLED) target = 0;
    }

    if (target < sim.dist - 1) {
      // Loop reset: restore physics bodies
      sim.dist = target;
      sim.bodies = createSim(plan).bodies;
      sim.registered.fill(false);
      sim.landed = [];
    } else if (target < sim.dist - 1e-6) {
      sim.dist = target;
    }

    const robot = robotRef.current;
    let turnDiff = 0;
    if (robot) {
       turnDiff = Math.abs(shortestAngle(robot.rotation.z, poseAtDistance(plan, sim.dist).heading));
    }
    const isTurning = turnDiff > 0.15; // approx 8.5 degrees

    const prevDist = sim.dist;

    const advanceRate = isTurning ? 0.3 : 9;
    sim.dist += (target - sim.dist) * (1 - Math.exp(-dt * advanceRate));
    if (Math.abs(target - sim.dist) < 0.02 && !isTurning) sim.dist = target;

    const moving = sim.dist - prevDist > 1e-4;
    const dist = sim.dist;

    // Robot.
    const pose = poseAtDistance(plan, dist);
    const wx = gx(pose.x);
    const wy = gy(pose.y);
    if (robot) {
      robot.position.set(wx, wy, T / 2);
      robot.rotation.z += shortestAngle(robot.rotation.z, pose.heading) * (1 - Math.exp(-dt * 14));
    }
    robotPos.set(wx, wy, T / 2 + 0.3);
    
    const isMissionRunning = mission.status === MissionStatus.IN_PROGRESS;
    const isPreviewing = overrideProgress !== undefined && !isMissionRunning && overrideProgress < 100;
    const cutting = pose.torchOn && moving && !isTurning && (isMissionRunning || isPreviewing);
    if (torchLight.current) torchLight.current.intensity = cutting ? 5 + Math.random() * 3 : 0;
    if (flameRef.current) flameRef.current.visible = cutting;
    if (glowRef.current) {
      glowRef.current.visible = cutting;
      glowRef.current.position.set(wx, wy, T / 2 + 0.006);
      glowRef.current.scale.setScalar(0.8 + Math.random() * 0.4);
    }

    // Kerf lines behind the torch.
    cutSteps.forEach((s, i) => {
      const m = kerfRefs.current[i];
      if (!m) return;
      const frac = Math.max(0, Math.min(1, (dist - s.startDist) / s.length));
      if (frac <= 0) {
        m.visible = false;
        return;
      }
      m.visible = true;
      const x1 = gx(s.x1);
      const y1 = gy(s.y1);
      const ex = x1 + (gx(s.x2) - x1) * frac;
      const ey = y1 + (gy(s.y2) - y1) * frac;
      m.position.set((x1 + ex) / 2, (y1 + ey) / 2, T / 2 + 0.004);
      m.scale.set(Math.max(KERF, Math.abs(ex - x1) + KERF), Math.max(KERF, Math.abs(ey - y1) + KERF), 1);
    });

    // Release pieces whose outline has been fully cut, then simulate the fall.
    plan.pieces.forEach((p, i) => {
      const body = sim.bodies[i];
      if (body.phase === 'attached' && (dist >= p.releaseDist - 1e-6 || (mission.status === MissionStatus.COMPLETED && target >= total))) {
        releaseBody(body);
      }
      stepBody(body, sim.params[i], dt, { floorY: 0, landed: sim.landed });
      if (body.phase === 'rest' && !sim.registered[i]) {
        sim.registered[i] = true;
        sim.landed.push(footprintOf(body, sim.params[i]));
      }
      const g = pieceRefs.current[i];
      if (g) {
        g.position.set(sim.params[i].cx, body.cy, body.cz);
        g.rotation.x = body.theta;
      }
    });

    // Sparks.
    const sp = sim.sparks;
    if (cutting) {
      sp.acc += dt * 160;
      while (sp.acc >= 1) {
        sp.acc -= 1;
        const k = sp.next;
        sp.next = (sp.next + 1) % SPARK_COUNT;
        sp.pos[k * 3] = wx;
        sp.pos[k * 3 + 1] = wy;
        sp.pos[k * 3 + 2] = T / 2;
        sp.vel[k * 3] = (Math.random() - 0.5) * 2.4;
        sp.vel[k * 3 + 1] = Math.random() * 1.4 - 0.3;
        sp.vel[k * 3 + 2] = 1 + Math.random() * 2.2;
        sp.life[k] = 0.5 + Math.random() * 0.5;
      }
    }
    const inst = sparkRef.current;
    if (inst) {
      for (let k = 0; k < SPARK_COUNT; k++) {
        if (sp.life[k] > 0) {
          sp.life[k] -= dt;
          sp.vel[k * 3 + 1] -= 9.81 * dt;
          sp.pos[k * 3] += sp.vel[k * 3] * dt;
          sp.pos[k * 3 + 1] += sp.vel[k * 3 + 1] * dt;
          sp.pos[k * 3 + 2] += sp.vel[k * 3 + 2] * dt;
          if (sp.pos[k * 3 + 1] < 0.01) {
            sp.pos[k * 3 + 1] = 0.01;
            sp.vel[k * 3 + 1] *= -0.3;
          }
        }
        const alive = sp.life[k] > 0;
        dummy.position.set(sp.pos[k * 3], sp.pos[k * 3 + 1], sp.pos[k * 3 + 2]);
        dummy.scale.setScalar(alive ? Math.min(1, sp.life[k] * 2.5) : 0);
        dummy.updateMatrix();
        inst.setMatrixAt(k, dummy.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <CameraRig view={view} controls={controls} robotPos={robotPos} center={center} />
      <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI * 0.52} minDistance={2} maxDistance={40} />

      <color attach="background" args={['#0d141b']} />
      <fog attach="fog" args={['#0d141b', 28, 70]} />
      <ambientLight intensity={0.7} color="#b4c4d6" />
      <hemisphereLight args={['#cfe3ff', '#1a222a', 0.55]} />
      <directionalLight
        position={[7, 12, 10]}
        intensity={2.2}
        color="#fff1dd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={45}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-8, 5, 6]} intensity={0.5} color="#8fb0d6" />

      {/* Dock floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 6]} receiveShadow>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#c0c5c1" roughness={0.9} metalness={0.1} />
      </mesh>
      <Grid position={[0, 0.002, 6]} args={[80, 60]} cellSize={1} cellThickness={0.6} cellColor="#9aa09b" sectionSize={5} sectionThickness={1.1} sectionColor="#7a807b" fadeDistance={45} fadeStrength={1.5} infiniteGrid={false} />

      {/* Full 3D Ship Structure (wrapping the cutting plane) */}
      <group>
         {/* Bottom Hull */}
         <mesh position={[0, ELEV - 0.6, -1.6]} receiveShadow castShadow>
            <boxGeometry args={[W + 2, 1.2, 3.5]} />
            <meshStandardMaterial color="#5c1919" roughness={0.7} />
         </mesh>
         {/* Top Deck */}
         <mesh position={[0, ELEV + H + 0.2, -1.6]} receiveShadow castShadow>
            <boxGeometry args={[W + 2, 0.4, 3.5]} />
            <meshStandardMaterial color="#2d3742" roughness={0.9} />
         </mesh>
         {/* Back Hull */}
         <mesh position={[0, ELEV + H / 2, -3.2]} receiveShadow castShadow>
            <boxGeometry args={[W + 2, H, 0.4]} />
            <meshStandardMaterial color="#3a4552" roughness={0.6} />
         </mesh>
         {/* Left Side (Stern) */}
         <mesh position={[-(W/2 + 0.5), ELEV + H / 2, -1.6]} receiveShadow castShadow>
            <boxGeometry args={[1, H, 3.5]} />
            <meshStandardMaterial color="#3a4552" roughness={0.6} />
         </mesh>
         {/* Right Side (Bow) */}
         <mesh position={[W/2 + 1.2, ELEV + H / 2 - 0.3, -1.6]} rotation={[0, 0, Math.PI / 16]} receiveShadow castShadow>
            <cylinderGeometry args={[0.1, 2, H + 1, 16]} />
            <meshStandardMaterial color="#3a4552" roughness={0.6} />
         </mesh>
         {/* Superstructure (Bridge/Cabin) */}
         <mesh position={[W * 0.3, ELEV + H + 1.3, -1.6]} receiveShadow castShadow>
            <boxGeometry args={[W * 0.2, 1.8, 2.5]} />
            <meshStandardMaterial color="#d4dde6" roughness={0.4} />
         </mesh>
         {/* Funnel */}
         <mesh position={[W * 0.2, ELEV + H + 2.6, -1.6]} receiveShadow castShadow>
            <cylinderGeometry args={[0.3, 0.4, 1.5, 16]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.6} />
         </mesh>
         {/* Ship Interior Darkness (void behind the cut plate) */}
         <mesh position={[0, ELEV + H / 2, -0.4]} receiveShadow>
            <boxGeometry args={[W, H, 0.6]} />
            <meshStandardMaterial color="#05080b" roughness={1} />
         </mesh>
      </group>

      {/* Uncut hull plate */}
      {runGeos.map((r) => (
        <mesh key={r.key} geometry={r.geo} material={mats.array} position={r.pos} castShadow receiveShadow />
      ))}

      {/* Pieces to be cut (they fall once the last edge is cut) */}
      {rects.map((r, i) => (
        <group
          key={r.id}
          ref={(el) => {
            pieceRefs.current[i] = el;
          }}
          position={[pieceParams[i].cx, pieceParams[i].cy0, 0]}
        >
          <mesh geometry={pieceGeos[i]} material={mats.array} castShadow receiveShadow />
        </group>
      ))}

      {/* Cut kerf lines */}
      {cutSteps.map((s, i) => (
        <mesh
          key={s.index}
          ref={(el) => {
            kerfRefs.current[i] = el;
          }}
          visible={false}
        >
          <boxGeometry args={[1, 1, 0.01]} />
          <meshStandardMaterial color="#160b05" emissive="#ff5a00" emissiveIntensity={0.55} roughness={0.8} />
        </mesh>
      ))}

      {/* Torch heat glow on the plate */}
      <mesh ref={glowRef} visible={false}>
        <circleGeometry args={[0.16, 24]} />
        <meshBasicMaterial color="#ff7a1a" transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Crawler robot with a lateral moving hand/arm */}
      <group ref={robotRef} scale={ROBOT_SCALE}>
        {/* Torch nozzle exactly at (0,0,0) cutting the surface */}
        <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.02, 0.16, 12]} />
          <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.35} />
        </mesh>
        
        {/* Arm extending from crawler to the torch */}
        <mesh position={[-0.15, 0, 0.12]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.3]} />
          <meshStandardMaterial color="#88929b" metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh position={[-0.15, 0, 0.12]} castShadow>
           <sphereGeometry args={[0.03]} />
           <meshStandardMaterial color="#38424c" />
        </mesh>

        {/* Crawler Base (Offset by X = -0.3) */}
        <group position={[-0.3, 0, 0.05]}>
          <mesh castShadow position={[0, 0, 0.05]}>
            <boxGeometry args={[0.2, 0.35, 0.1]} />
            <meshStandardMaterial color="#1f4b7a" metalness={0.55} roughness={0.4} />
          </mesh>
          {/* Electromagnet Tracks */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.12, 0, 0]} castShadow>
              <boxGeometry args={[0.06, 0.4, 0.1]} />
              <meshStandardMaterial color="#12161b" roughness={0.9} />
            </mesh>
          ))}
          {/* Status/Control Box on top of crawler */}
          <mesh position={[0, 0.05, 0.12]} castShadow>
            <boxGeometry args={[0.15, 0.15, 0.08]} />
            <meshStandardMaterial color="#d9e2ec" metalness={0.3} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.05, 0.16]}>
            <sphereGeometry args={[0.015, 12, 12]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.2} />
          </mesh>
        </group>

        {/* Oxy-acetylene flame core (Blue/White) */}
        <mesh ref={flameRef} position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
          <coneGeometry args={[0.01, 0.06, 12]} />
          <meshBasicMaterial color="#aaddff" toneMapped={false} />
        </mesh>
        <pointLight ref={torchLight} position={[0, 0, 0.05]} color="#ff8a3d" intensity={0} distance={3.5} decay={2} />
      </group>

      {/* Sparks */}
      <instancedMesh ref={sparkRef} args={[undefined, undefined, SPARK_COUNT]} frustumCulled={false}>
        <boxGeometry args={[0.025, 0.025, 0.025]} />
        <meshBasicMaterial color="#ffc15e" toneMapped={false} />
      </instancedMesh>
    </>
  );
}

export interface CutSimulation3DProps {
  plan: CutJobPlan;
  imageUrl: string | null;
  /** Key that changes whenever the simulation has to restart (new plan / new mission). */
  resetKey: string;
  statusLabel: string;
  torchOn: boolean;
  overrideProgress?: number;
}

export function CutSimulation3D({ plan, imageUrl, resetKey, statusLabel, torchOn, overrideProgress }: CutSimulation3DProps) {
  const texture = usePhotoTexture(imageUrl);
  const [view, setView] = useState<CameraView>('angle');

  return (
    <div id="cut-3d" style={{ position: 'relative', width: '100%', height: 'min(62vh, 560px)', minHeight: 340, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#0d141b' }}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [6.5, 6, 13.5], fov: 42, near: 0.1, far: 200 }}>
        {texture && <CutScene key={resetKey} plan={plan} texture={texture} view={view} overrideProgress={overrideProgress} />}
      </Canvas>

      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {VIEW_LABELS.map((v) => (
          <button
            key={v.id}
            id={`cut-view-${v.id}`}
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
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: torchOn ? '#ff5a1a' : '#64748b', boxShadow: torchOn ? '0 0 8px #ff5a1a' : 'none' }} />
        <strong>TORCH {torchOn ? 'ON' : 'OFF'}</strong>
        <span style={{ color: 'var(--text-secondary)' }}>{statusLabel}</span>
      </div>
    </div>
  );
}
