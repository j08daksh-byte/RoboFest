import * as THREE from 'three';
import { IHullSurface, SurfaceQueryResult } from './HullSurfaceQuery';
import { shipConfig } from './shipConfig';

export class ProceduralShipSurface implements IHullSurface {
  /**
   * Evaluate the ship surface position at (u, v)
   * @param u Longitudinal parameter: 0 (stern) to 1 (bow)
   * @param v Transverse/Girth parameter: -1 (port deck) to 0 (keel) to 1 (starboard deck)
   */
  public evaluatePosition(u: number, v: number): THREE.Vector3 {
    // Clamp parameters
    const cu = Math.max(0, Math.min(1, u));
    const cv = Math.max(-1, Math.min(1, v));
    const absV = Math.abs(cv);
    const signV = Math.sign(cv);

    const L = shipConfig.lengthOverall;
    const B = shipConfig.beam;
    const H = shipConfig.hullHeight;

    // nx goes from -1 (stern) to +1 (bow)
    const nx = (cu - 0.5) * 2;

    // --- 1. LONGITUDINAL STATION PARAMETERS ---
    
    // Sheer (deck edge rising at ends)
    let sheer = 0;
    if (nx > 0) sheer = Math.pow(nx, 3) * 2.5; // 2.5m rise at bow
    else sheer = Math.pow(-nx, 3) * 1.0; // 1.0m rise at stern
    const localHeight = H + sheer;

    // Bottom half-beam (width of the flat bottom/waterline)
    let b_w = B / 2;
    if (nx > 0.5) {
      // Bow parabolic taper to a sharp stem line (b_w = 0)
      const t = (nx - 0.5) / 0.5;
      b_w = (B / 2) * (1 - Math.pow(t, 2));
    } else if (nx < -0.7) {
      // Stern transom taper (transom is ~60% of full beam)
      const t = (-nx - 0.7) / 0.3;
      b_w = (B / 2) * (1 - 0.4 * Math.pow(t, 2));
    }

    // Flare (extra width added at the deck edge)
    let flare = 0;
    if (nx > 0) flare = Math.pow(nx, 2) * (B * 0.2); // Outward flare up to 20% beam at bow

    const deckWidth = b_w + flare;

    // Rake (longitudinal shifting of upper hull sections)
    let rakeAmount = 0;
    if (nx > 0.8) rakeAmount = Math.pow((nx - 0.8) / 0.2, 2) * 4.0; // 4m forward rake at stem
    else if (nx < -0.85) rakeAmount = -Math.pow((-nx - 0.85) / 0.15, 2) * 1.5; // 1.5m aft rake at transom

    // --- 2. TRANSVERSE SECTION PROFILE ---
    
    let x = 0;
    let z = 0;
    
    const V_BOT = 0.15;
    const V_BILGE = 0.30;
    
    // Ensure bilge radius and deadrise don't break at the sharp stem (when b_w ~ 0)
    const actualBilgeR = Math.max(0.001, Math.min(2.0, b_w * 0.95));
    const deadrise = 0.5 * Math.min(1, b_w / (B / 2));

    if (absV <= V_BOT) {
      // Flat bottom
      const t = absV / V_BOT;
      x = t * (b_w - actualBilgeR);
      z = t * deadrise;
    } else if (absV <= V_BILGE) {
      // Bilge radius
      const t = (absV - V_BOT) / (V_BILGE - V_BOT);
      const theta = t * (Math.PI / 2); // 0 to 90 degrees
      x = (b_w - actualBilgeR) + actualBilgeR * Math.sin(theta);
      z = deadrise + actualBilgeR * (1 - Math.cos(theta));
    } else {
      // Side wall / flare
      const t = (absV - V_BILGE) / (1 - V_BILGE);
      x = b_w + t * (deckWidth - b_w);
      z = deadrise + actualBilgeR + t * (localHeight - (deadrise + actualBilgeR));
    }

    // --- 3. ASSEMBLE WORLD POSITION ---
    
    let y = (cu - 0.5) * L;
    
    // Apply rake: Z dictates how much of the rake offset is applied
    const zRatio = Math.max(0, Math.min(1.0, z / localHeight));
    y += zRatio * rakeAmount;
    
    return new THREE.Vector3(x * signV, y, z);
  }

  querySurfacePoint(u: number, v: number): SurfaceQueryResult {
    const eps = 0.001;
    
    const pos = this.evaluatePosition(u, v);
    
    // Compute tangent (dU)
    const pu1 = this.evaluatePosition(u - eps, v);
    const pu2 = this.evaluatePosition(u + eps, v);
    const tangent = new THREE.Vector3().subVectors(pu2, pu1).normalize();
    
    // Compute binormal (dV)
    const pv1 = this.evaluatePosition(u, v - eps);
    const pv2 = this.evaluatePosition(u, v + eps);
    const binormal = new THREE.Vector3().subVectors(pv2, pv1).normalize();
    
    // Normal is cross product
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
    
    // Ensure normal points firmly outward from the internal hull volume
    // Reference center point for this section
    const center = new THREE.Vector3(0, pos.y, shipConfig.hullHeight * 0.5);
    const outwardVec = new THREE.Vector3().subVectors(pos, center).normalize();
    
    if (normal.dot(outwardVec) < 0) {
      normal.negate();
    }
    
    // Re-orthogonalize tangent to ensure perfectly orthogonal basis
    tangent.crossVectors(normal, binormal).normalize();
    
    // The tangent should generally point forward (+Y direction)
    if (tangent.y < 0) tangent.negate();
    
    return {
      position: pos,
      normal,
      tangent
    };
  }
}
