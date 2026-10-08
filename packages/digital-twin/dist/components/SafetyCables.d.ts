import React from 'react';
import * as THREE from 'three';
export declare function getRobotWorldPosition(localPos: {
    x: number;
    y: number;
    z: number;
}): THREE.Vector3;
export declare function CatenaryCable({ start, end, sag, color, thickness }: {
    start: THREE.Vector3;
    end: THREE.Vector3;
    sag: number;
    color?: string;
    thickness?: number;
}): React.JSX.Element;
export declare function PulleySystem({ position }: {
    position: THREE.Vector3;
}): React.JSX.Element;
export declare function SafetyCables(): React.JSX.Element;
