import React, { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRobotStore } from '@/lib/robotState';
import { robotConfig } from '@/lib/robotConfig';

const SNAP_TOLERANCE = 1.5;

/**
 * Cross-session loop detection.
 * Builds an endpoint graph from all open (isClosed=false) strokes.
 * Optionally includes the current activeCutPath as a virtual stroke.
 * Uses DFS to find a cycle. If found, merges the strokes into one
 * closed cut, removes the originals, and clears activeCutPath if used.
 */
function detectCrossSessionLoops(includeActivePath: boolean): void {
  const state = useRobotStore.getState();
  const openStrokes = state.completedCuts.filter(c => !c.isClosed);

  // Build stroke list, optionally including current activeCutPath
  const strokes: Array<{id: string, path: Array<{x: number, y: number}>, isVirtual: boolean}> =
    openStrokes.map(s => ({id: s.id, path: s.path, isVirtual: false}));

  if (includeActivePath && state.activeCutPath.length > 2) {
    strokes.push({id: '__active__', path: [...state.activeCutPath], isVirtual: true});
  }

  if (strokes.length < 2) return;

  // --- Build endpoint graph ---
  const nodes: Array<{x: number, y: number}> = [];
  function snapNode(x: number, y: number): number {
    for (let i = 0; i < nodes.length; i++) {
      if (Math.hypot(x - nodes[i].x, y - nodes[i].y) < SNAP_TOLERANCE) return i;
    }
    nodes.push({x, y});
    return nodes.length - 1;
  }

  const adj = new Map<number, Array<{si: number, nb: number, rev: boolean}>>();
  function addEdge(from: number, to: number, si: number) {
    if (!adj.has(from)) adj.set(from, []);
    if (!adj.has(to)) adj.set(to, []);
    adj.get(from)!.push({si, nb: to, rev: false});
    adj.get(to)!.push({si, nb: from, rev: true});
  }

  for (let si = 0; si < strokes.length; si++) {
    const p = strokes[si].path;
    if (p.length < 2) continue;
    const sn = snapNode(p[0].x, p[0].y);
    const en = snapNode(p[p.length - 1].x, p[p.length - 1].y);
    if (sn !== en) addEdge(sn, en, si);
  }

  // --- DFS cycle detection ---
  function dfs(start: number, cur: number, used: Set<number>,
               path: Array<{si: number, rev: boolean}>, depth: number): Array<{si: number, rev: boolean}> | null {
    if (depth > 8) return null;
    for (const e of (adj.get(cur) || [])) {
      if (used.has(e.si)) continue;
      if (e.nb === start && path.length >= 1) {
        return [...path, {si: e.si, rev: e.rev}];
      }
      used.add(e.si);
      path.push({si: e.si, rev: e.rev});
      const res = dfs(start, e.nb, used, path, depth + 1);
      if (res) return res;
      path.pop();
      used.delete(e.si);
    }
    return null;
  }

  let cycle: Array<{si: number, rev: boolean}> | null = null;
  for (let n = 0; n < nodes.length; n++) {
    if ((adj.get(n)?.length ?? 0) < 2) continue;
    cycle = dfs(n, n, new Set(), [], 0);
    if (cycle) break;
  }

  if (!cycle) return;

  // --- Build combined path from cycle ---
  const combined: Array<{x: number, y: number}> = [];
  const ids = new Set<string>();
  let hasVirtual = false;

  for (const step of cycle) {
    const s = strokes[step.si];
    ids.add(s.id);
    if (s.isVirtual) hasVirtual = true;
    const pts = step.rev ? [...s.path].reverse() : s.path;
    for (let i = (combined.length > 0 ? 1 : 0); i < pts.length; i++) {
      combined.push({x: pts[i].x, y: pts[i].y});
    }
  }

  // --- Shoelace area validation ---
  let area = 0;
  for (let i = 0; i < combined.length; i++) {
    const j = (i + 1) % combined.length;
    area += combined[i].x * combined[j].y - combined[j].x * combined[i].y;
  }
  area = Math.abs(area) / 2;
  if (area < 0.1) return;

  console.log(`CROSS-SESSION LOOP: ${cycle.length} strokes, area=${area.toFixed(2)}`);

  useRobotStore.setState(s => ({
    completedCuts: [
      ...s.completedCuts.filter(c => !ids.has(c.id)),
      {id: Math.random().toString(36).substring(2, 9), path: combined, isClosed: true}
    ],
    activeCutPath: hasVirtual ? [] : s.activeCutPath
  }));
}


export function SimulationController() {
  const { 
    simulationState,
    setTorch, setArmPosition, 
    setLocomotionIntent, updateLocomotion
  } = useRobotStore();
  
  const { 
    armMaxPositionY, armMinPositionY, armMaxExtensionX, armMinExtensionX,
    maxPositionX, minPositionX, maxPositionY, minPositionY, moveSpeed
  } = robotConfig;

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const intent = useRobotStore.getState().locomotionIntent;
      let newX = intent.x;
      let newY = intent.y;

      switch(e.key.toLowerCase()) {
        case 'w': case 'arrowup': newX = -1; break; // Forward is now up the hull (-X)
        case 's': case 'arrowdown': newX = 1; break; // Backward is now down the hull (+X)
        case 'a': case 'arrowleft': newY = -1; break; // Left is now aft (-Y)
        case 'd': case 'arrowright': newY = 1; break; // Right is now forward (+Y)
        case ' ':
          const em = useRobotStore.getState().electromagnet.enabled;
          useRobotStore.getState().setElectromagnet(!em);
          break;
      }
      setLocomotionIntent(newX, newY);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const intent = useRobotStore.getState().locomotionIntent;
      let newX = intent.x;
      let newY = intent.y;

      switch(e.key.toLowerCase()) {
        case 'w': case 'arrowup': if (newX === -1) newX = 0; break;
        case 's': case 'arrowdown': if (newX === 1) newX = 0; break;
        case 'a': case 'arrowleft': if (newY === -1) newY = 0; break;
        case 'd': case 'arrowright': if (newY === 1) newY = 0; break;
      }
      setLocomotionIntent(newX, newY);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setLocomotionIntent]);

  useFrame((state, delta) => {
    // 1. Handle Locomotion
    const storeState = useRobotStore.getState();
    const { locomotionIntent, electromagnet, position, torch, activeCutPath, arm } = storeState;
    
    // Only move if not locked
    if (!electromagnet.enabled && (locomotionIntent.x !== 0 || locomotionIntent.y !== 0)) {
      const dx = locomotionIntent.x * moveSpeed * delta;
      const dy = locomotionIntent.y * moveSpeed * delta;
      
      let nextX = position.x + dx;
      let nextY = position.y + dy;
      
      // Bound it to the hull workspace
      nextX = Math.max(minPositionX, Math.min(maxPositionX, nextX));
      nextY = Math.max(minPositionY, Math.min(maxPositionY, nextY));

      // Calculate track offset delta for animation (robot's forward is -X)
      const trackOffsetDelta = -(nextX - position.x);
      
      updateLocomotion(nextX, nextY, trackOffsetDelta);
    }

    // 2. Real Torch Tracking (Part G & H & I & K)
    if (simulationState === 'reset') {
      storeState.clearAllCuts();
      setTorch(false);
    } else {
      if (torch.enabled) {
        // Torch is ON
        const { bodyWidthX } = robotConfig;
        
        // 1. Calculate Torch position in World Space taking into account the 90 degree visual rotation of the robot
        // The unrotated robot has X as right, Y as forward. 
        // Torch local unrotated: X = bodyWidthX / 2 + arm.xExtension (Right), Y = arm.yPosition (Forward).
        // After rotating +90 around Z, New X = -Y, New Y = X.
        const rightOffset = bodyWidthX / 2 + arm.xExtension;
        const forwardOffset = arm.yPosition;
        
        const currentTorchX = position.x - forwardOffset;
        const currentTorchY = position.y + rightOffset;

        if (isNaN(currentTorchX) || isNaN(currentTorchY)) {
          if (storeState.activeCutPath.length > 0) storeState.discardActiveCut();
          return;
        }

        // Only add point if it moved a minimum distance from the last point to avoid dense arrays
        if (storeState.activeCutPath.length === 0) {
          storeState.addCutPoint(currentTorchX, currentTorchY);
        } else {
          const lastPoint = storeState.activeCutPath[storeState.activeCutPath.length - 1];
          const dist = Math.hypot(currentTorchX - lastPoint.x, currentTorchY - lastPoint.y);
          
          if (dist > 1.0) {
            // Jumped too far! Discard the current invalid path.
            storeState.discardActiveCut();
            storeState.addCutPoint(currentTorchX, currentTorchY);
          } else if (dist > 0.02) { // 2cm resolution
            storeState.addCutPoint(currentTorchX, currentTorchY);
            
            // ============================================================
            // ROBUST CLOSED LOOP DETECTION
            // Scans activeCutPath for closure against ANY earlier point,
            // not just point 0. This enables continuous multi-loop cutting
            // where transit segments precede the actual loop shape.
            // ============================================================
            const freshPath = useRobotStore.getState().activeCutPath;
            const MIN_LOOP_POINTS = 15;
            
            if (freshPath.length > MIN_LOOP_POINTS) {
              const endPt = freshPath[freshPath.length - 1];
              const maxCheckIndex = freshPath.length - MIN_LOOP_POINTS;
              
              // Scan from highest valid index downward to find the TIGHTEST loop first
              for (let ci = maxCheckIndex; ci >= 0; ci--) {
                const candidateStart = freshPath[ci];
                const closureDist = Math.hypot(endPt.x - candidateStart.x, endPt.y - candidateStart.y);
                
                // Stage 1: Quick pre-filter with generous fixed tolerance
                if (closureDist > 2.0) continue;
                
                // Stage 2: Compute loop sub-path metrics
                let lMinX = Infinity, lMaxX = -Infinity, lMinY = Infinity, lMaxY = -Infinity;
                let loopLength = 0;
                for (let k = ci; k < freshPath.length; k++) {
                  const p = freshPath[k];
                  if (p.x < lMinX) lMinX = p.x;
                  if (p.x > lMaxX) lMaxX = p.x;
                  if (p.y < lMinY) lMinY = p.y;
                  if (p.y > lMaxY) lMaxY = p.y;
                  if (k > ci) {
                    loopLength += Math.hypot(p.x - freshPath[k - 1].x, p.y - freshPath[k - 1].y);
                  }
                }
                
                const boundingDiag = Math.hypot(lMaxX - lMinX, lMaxY - lMinY);
                
                // Adaptive tolerance: scales with loop size, capped reasonably
                const tolerance = Math.min(1.5, Math.max(0.3, boundingDiag * 0.15));
                
                if (closureDist > tolerance) continue;
                if (loopLength < 0.5) continue;
                
                // Stage 3: Shoelace area (reject tiny accidental closures)
                let area = 0;
                for (let k = ci; k < freshPath.length; k++) {
                  const kNext = k + 1 < freshPath.length ? k + 1 : ci;
                  area += freshPath[k].x * freshPath[kNext].y;
                  area -= freshPath[kNext].x * freshPath[k].y;
                }
                area = Math.abs(area) / 2;
                
                if (area < 0.1) continue;
                
                // VALID CLOSED LOOP DETECTED!
                console.log(`CUT LOOP CLOSED: idx=${ci}, pts=${freshPath.length - ci}, area=${area.toFixed(2)}, tol=${tolerance.toFixed(3)}`);
                
                const loopPath = freshPath.slice(ci);
                const prefixPath = freshPath.slice(0, ci);
                
                // Build new completed cuts
                const newCuts: Array<{id: string, path: Array<{x: number, y: number}>, isClosed: boolean}> = [];
                
                // Commit prefix (transit) as open cut if substantial
                if (prefixPath.length > 2) {
                  newCuts.push({
                    id: Math.random().toString(36).substring(2, 9),
                    path: prefixPath,
                    isClosed: false
                  });
                }
                
                // Commit the loop as a closed cut
                newCuts.push({
                  id: Math.random().toString(36).substring(2, 9),
                  path: loopPath,
                  isClosed: true
                });
                
                useRobotStore.setState((s) => ({
                  completedCuts: [...s.completedCuts, ...newCuts],
                  activeCutPath: []
                }));
                
                break; // One closure commit per frame
              }
            }

            // Cross-session proximity check: does current path near an existing stroke endpoint?
            const latestAP = useRobotStore.getState().activeCutPath;
            if (latestAP.length > 5) {
              const xOpenStrokes = useRobotStore.getState().completedCuts.filter(c => !c.isClosed);
              if (xOpenStrokes.length > 0) {
                const ep = latestAP[latestAP.length - 1];
                for (const s of xOpenStrokes) {
                  if (Math.hypot(ep.x - s.path[0].x, ep.y - s.path[0].y) < SNAP_TOLERANCE ||
                      Math.hypot(ep.x - s.path[s.path.length - 1].x, ep.y - s.path[s.path.length - 1].y) < SNAP_TOLERANCE) {
                    detectCrossSessionLoops(true);
                    break;
                  }
                }
              }
            }
          }
        }
      }
    
      // When Torch turns OFF, commit remaining active path as open cut,
      // then check if it completes a cross-session loop.
      if (!torch.enabled) {
        const freshAP = useRobotStore.getState().activeCutPath;
        if (freshAP.length > 0) {
          useRobotStore.getState().completeCut(false);
          detectCrossSessionLoops(false);
        }
      }
    }
  });

  return null;
}
