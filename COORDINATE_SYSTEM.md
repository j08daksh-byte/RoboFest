# Coordinate System Convention

**ABSOLUTELY CRITICAL:** Use this exact coordinate system throughout the entire application.

The vertical ship hull surface lies perfectly on the **X-Y plane**.

## Axes Definition
- **X axis**: Horizontal direction across the ship surface.
- **Y axis**: Vertical direction on the ship surface.
- **Z axis**: Normal direction to the ship surface. (+Z = outward from the ship hull, -Z = toward / into the ship hull)

## Visual Aid
             +Y
              ↑
              │
              │
              │
              └────────────→ +X
             SHIP HULL (X-Y plane)

## Robot Configuration Details
- **Robot Body**: Lies against the X-Y hull surface.
- **Cutting Arm**: Extends from the right side of the robot body towards +X.
- **Vertical Movement**: The entire arm/carriage assembly moves vertically along Y. The cutting path is primarily parallel to Y.
- **Torch Direction**: The torch points toward the ship surface along -Z.
- **Torch Orientation**: FIXED. The torch must NOT rotate, must NOT independently rotate around any axis, and must NOT be modeled as a freely articulated robotic arm.
