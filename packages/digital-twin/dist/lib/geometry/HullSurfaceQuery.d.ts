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
export declare class TestEllipsoidSurface implements IHullSurface {
    private radiusX;
    private radiusY;
    private radiusZ;
    constructor(rx?: number, ry?: number, rz?: number);
    querySurfacePoint(u: number, v: number): SurfaceQueryResult;
}
/**
 * Utility to compute a quaternion from a surface normal and forward tangent.
 *
 * @param normal The surface normal vector (up vector for the robot)
 * @param tangent The surface tangent vector (forward vector for the robot)
 * @returns A quaternion representing the robot's orientation
 */
export declare function computeRobotOrientation(normal: THREE.Vector3, tangent: THREE.Vector3): THREE.Quaternion;
