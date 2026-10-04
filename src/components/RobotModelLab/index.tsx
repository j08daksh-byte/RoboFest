'use client';
import React, { useState } from 'react';
import { RobotModel as OriginalRobotModel } from '../DigitalTwin/RobotModel';
import { RobotAssembly as NewRobotAssembly } from './RobotAssembly';
import { Text } from '@react-three/drei';

export function RobotModelLab() {
  const [showOriginal, setShowOriginal] = useState(true);

  // In original RobotModel: Y is Longitudinal, X is Lateral.
  // In our new RobotAssembly: X is Longitudinal, Y is Lateral.
  // To place them side by side along the X-axis for viewing:
  
  return (
    <group>
      {/* Original Baseline Reference */}
      <group position={[0, -1, 0]}>
        {/* We wrap original in a group. Original moves based on robotStore. 
            For the lab, it might be tied to store (which is at origin if no mission). 
            We rotate original -90 deg on Z to make it point along X, matching new convention.
        */}
        <group rotation={[0, 0, -Math.PI / 2]}>
          <OriginalRobotModel showAxes={true} />
        </group>
        <Text position={[0, -0.6, 0.5]} rotation={[Math.PI/2, Math.PI, 0]} fontSize={0.1} color="white">
          CURRENT DIGITAL TWIN BASELINE
        </Text>
      </group>

      {/* New Component Architecture Assembly */}
      <group position={[0, 1, 0]}>
        <NewRobotAssembly />
        <Text position={[0, -0.6, 0.5]} rotation={[Math.PI/2, Math.PI, 0]} fontSize={0.1} color="#44ffaa">
          ROBOT MODEL LAB (NEW ARCHITECTURE)
        </Text>
      </group>
    </group>
  );
}
