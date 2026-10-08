import React from 'react';
export type CameraPreset = 'RESET' | 'FRONT' | 'REAR' | 'STARBOARD' | 'PORT' | 'TOP' | 'BOTTOM' | 'ISOMETRIC';
export type InspectionTarget = 'Whole Ship' | 'Bow' | 'Midship' | 'Stern' | 'Keel';
interface TestShipCameraControllerProps {
    preset: CameraPreset;
    targetPreset: InspectionTarget;
}
export declare function TestShipCameraController({ preset, targetPreset }: TestShipCameraControllerProps): React.JSX.Element;
export {};
