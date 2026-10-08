import * as THREE from 'three';
import { IHullSurface, SurfaceQueryResult } from './HullSurfaceQuery';
export declare class ProceduralShipSurface implements IHullSurface {
    /**
     * Evaluate the ship surface position at (u, v)
     * @param u Longitudinal parameter: 0 (stern) to 1 (bow)
     * @param v Transverse/Girth parameter: -1 (port deck) to 0 (keel) to 1 (starboard deck)
     */
    evaluatePosition(u: number, v: number): THREE.Vector3;
    querySurfacePoint(u: number, v: number): SurfaceQueryResult;
}
