import * as THREE from 'three';

export interface SurfaceQueryResult {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  tangent: THREE.Vector3;
}

export interface IHullSurface {
  /**
   * Evaluates the surface at parameters u and v.
   * @param u Parameter typically representing longitudinal position
   * @param v Parameter typically representing transverse or arc-length position
   */
  querySurfacePoint(u: number, v: number): SurfaceQueryResult;
}

/**
 * A test surface representing a non-cylindrical shape, such as an ellipsoid.
 * The equations used ensure that normals change in multiple dimensions.
 */
export class TestEllipsoidSurface implements IHullSurface {
  private radiusX: number;
  private radiusY: number;
  private radiusZ: number;

  constructor(rx = 10, ry = 30, rz = 15) {
    this.radiusX = rx;
    this.radiusY = ry;
    this.radiusZ = rz;
  }

  querySurfacePoint(u: number, v: number): SurfaceQueryResult {
    // Map u and v to spherical coordinates for the ellipsoid
    // Let u be the angle in the XY plane (longitude), v be the angle from the Z axis (latitude)
    // To make it more like a hull where u is length and v is curve:
    // Let's use standard parametric equations for an ellipsoid:
    // x = rx * cos(v) * cos(u)
    // y = ry * sin(u)
    // z = rz * sin(v) * cos(u)
    
    // Actually, a simpler patch of an ellipsoid suitable for a hull:
    // u in [-pi/2, pi/2], v in [-pi/2, pi/2]
    // X axis: width, Y axis: length, Z axis: depth
    const x = this.radiusX * Math.sin(v);
    const y = this.radiusY * Math.sin(u);
    const z = -this.radiusZ * Math.cos(u) * Math.cos(v);

    const position = new THREE.Vector3(x, y, z);

    // Partial derivatives for tangent and normal
    // dP/du (tangent along the length, forward direction)
    const du_x = 0;
    const du_y = this.radiusY * Math.cos(u);
    const du_z = this.radiusZ * Math.sin(u) * Math.cos(v);
    const tangent = new THREE.Vector3(du_x, du_y, du_z).normalize();

    // dP/dv (tangent along the width)
    const dv_x = this.radiusX * Math.cos(v);
    const dv_y = 0;
    const dv_z = this.radiusZ * Math.cos(u) * Math.sin(v);
    const binormal = new THREE.Vector3(dv_x, dv_y, dv_z).normalize();

    // Normal is the cross product of binormal and tangent
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

    // Ensure normal points outward (towards positive Z)
    if (normal.z < 0) {
      normal.negate();
    }

    // Ensure tangent and normal are strictly orthogonal and normalized
    // (cross product should be, but just to be safe in floating point)
    tangent.crossVectors(normal, binormal).normalize();

    return {
      position,
      normal,
      tangent
    };
  }
}

/**
 * Utility to compute a quaternion from a surface normal and forward tangent.
 * 
 * @param normal The surface normal vector (up vector for the robot)
 * @param tangent The surface tangent vector (forward vector for the robot)
 * @returns A quaternion representing the robot's orientation
 */
export function computeRobotOrientation(normal: THREE.Vector3, tangent: THREE.Vector3): THREE.Quaternion {
  // We want the robot's local Y axis (up) to align with the normal.
  // We want the robot's local Z axis (forward) to align with the tangent.
  // We want the robot's local X axis (right) to be normal x tangent.
  // (In Three.js standard, Z is usually forward/backward depending on model, Y is up, X is right).
  // Assuming Robot model expects:
  // Forward = +Y axis (since ship length is along Y)
  // Up = +Z axis (normal to the hull)
  // Right = +X axis
  
  // Wait, let's create a standard basis:
  // vUp = normal
  // vForward = tangent
  // vRight = vForward cross vUp
  const vUp = normal.clone().normalize();
  const vForward = tangent.clone().normalize();
  const vRight = new THREE.Vector3().crossVectors(vForward, vUp).normalize();
  
  // Re-orthogonalize vForward just in case
  vForward.crossVectors(vUp, vRight).normalize();

  // Create a rotation matrix
  const mat = new THREE.Matrix4();
  // Matrix4.makeBasis takes (xAxis, yAxis, zAxis)
  // Our robot model in digital twin is oriented such that Y is forward, Z is up, X is right.
  // So:
  // xAxis = vRight
  // yAxis = vForward
  // zAxis = vUp
  mat.makeBasis(vRight, vForward, vUp);

  const quat = new THREE.Quaternion();
  quat.setFromRotationMatrix(mat);

  return quat;
}
