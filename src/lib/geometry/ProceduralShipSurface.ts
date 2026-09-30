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
    
    // Y: Longitudinal position (-60 to 60)
    const y = (cu - 0.5) * shipConfig.lengthOverall;
    
    // Local half-beam defines the tapering at bow and stern
    let halfBeam = shipConfig.beam / 2;
    if (cu < 0.25) { // Stern (0 to 0.25)
      const t = cu / 0.25; // 0 to 1
      // Smooth taper at the stern, not coming to a complete point (transom stern)
      halfBeam *= (0.4 + 0.6 * Math.sin(t * Math.PI / 2));
    } else if (cu > 0.75) { // Bow (0.75 to 1.0)
      const t = (1 - cu) / 0.25; // 1 down to 0
      // Parabolic bow taper coming to a point
      halfBeam *= (t * t);
    }
    
    // Determine cross section profile based on v
    const absV = Math.abs(cv);
    const signV = Math.sign(cv);
    
    let x = 0;
    let z = 0;
    
    // Let's create a smooth bilge radius (transition between flat bottom and flat side)
    // Parameter absV:
    // 0.0 to 0.2 : Bottom (Z goes 0 to bilge start, X goes 0 to halfBeam)
    // 0.2 to 1.0 : Side (Z goes bilge to deck, X is mostly halfBeam)
    
    const bilgeV = 0.2;
    if (absV < bilgeV) {
      // Bottom section
      const t = absV / bilgeV;
      x = t * (halfBeam * 0.95); // Mostly reaches full width
      z = (t * t) * (shipConfig.hullHeight * 0.1); // Slight deadrise/curve
    } else {
      // Side section
      const t = (absV - bilgeV) / (1 - bilgeV);
      // Slight inward taper (tumblehome) or outward flare near bow
      const flare = cu > 0.8 ? (cu - 0.8) * 10 * t : 0; // Bow flare
      
      // X transition smoothly up the side
      x = (halfBeam * 0.95) + (halfBeam * 0.05 * Math.sqrt(t)) + flare;
      z = (shipConfig.hullHeight * 0.1) + t * (shipConfig.hullHeight * 0.9);
    }
    
    return new THREE.Vector3(x * signV, y, z);
  }

  querySurfacePoint(u: number, v: number): SurfaceQueryResult {
    const eps = 0.001;
    
    const pos = this.evaluatePosition(u, v);
    
    // Numerical differentiation for tangent (longitudinal)
    // dP/du
    const pu1 = this.evaluatePosition(u - eps, v);
    const pu2 = this.evaluatePosition(u + eps, v);
    const tangent = new THREE.Vector3().subVectors(pu2, pu1).normalize();
    
    // Numerical differentiation for binormal (transverse)
    // dP/dv
    const pv1 = this.evaluatePosition(u, v - eps);
    const pv2 = this.evaluatePosition(u, v + eps);
    const binormal = new THREE.Vector3().subVectors(pv2, pv1).normalize();
    
    // Normal is cross product of binormal (girth) and tangent (length)
    // Wait, if binormal is X/Z and tangent is Y, X cross Y = Z (outward)
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
    
    // Depending on starboard vs port, the cross product direction might flip or need correcting.
    // Let's ensure normal always points outward away from centerline (x=0) and up (z>0)
    // The center of the hull is roughly at x=0, z=hullHeight/2.
    const outwardVec = new THREE.Vector3(pos.x, 0, pos.z).normalize();
    if (normal.dot(outwardVec) < 0) {
      normal.negate();
    }
    
    // Re-orthogonalize tangent
    tangent.crossVectors(normal, binormal).normalize();
    if (tangent.y < 0) tangent.negate(); // Ensure tangent points forward (+Y)
    
    return {
      position: pos,
      normal,
      tangent
    };
  }
}
