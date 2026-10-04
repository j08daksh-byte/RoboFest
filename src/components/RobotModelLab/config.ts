// Parametric modeling configuration for the Robot Model Lab

export const labRobotConfig = {
  // Coordinate Convention:
  // X = Longitudinal (Length, movement direction)
  // Y = Lateral (Width, arm extension direction)
  // Z = Vertical (Height)
  
  // NOTE: This differs from the original robotConfig which used Y for Length and X for Width.
  // The RobotModelLab component handles the rotation mapping if necessary, or we just design with X=Long.

  // --- OVERALL DIMENSIONS ---
  overallLengthX: 0.9,  // Derived from original track length
  overallWidthY: 0.5,   // Derived from original body width
  overallHeightZ: 0.35, // bodyHeightZ(0.15) + structureHeightZ(0.2)

  // --- CHASSIS ---
  chassisLengthX: 0.8,
  chassisWidthY: 0.4,
  chassisHeightZ: 0.15,
  chassisZOffset: 0.09, // Height above ground (track height / 2)

  // --- TRACKS ---
  trackWidthY: 0.12,
  trackLengthX: 0.9,
  trackHeightZ: 0.18,
  trackSpacingY: 0.5, // Distance between track centers

  // --- ESTIMATES & PLACEHOLDERS ---
  trackLinkLength: 0.05, // ESTIMATE
  trackLinkThickness: 0.02, // ESTIMATE

  driveWheelRadius: 0.07, // ESTIMATE
  idlerWheelRadius: 0.07, // ESTIMATE
  wheelSpacingX: 0.7, // ESTIMATE

  magnetRadius: 0.03,
  magnetThickness: 0.01,
  magnetCountPerTrack: 10,

  electromagnetRadius: 0.1,
  electromagnetHeightZ: 0.05,
  
  // --- ARM & UPPER STRUCTURE ---
  structureHeightZ: 0.2,
  structureWidthY: 0.6,
  structureLengthX: 0.5,

  armMaxExtensionY: 1.0, // Re-mapped to Y
  armMinExtensionY: 0.2,
  armThickness: 0.05,

  torchRadius: 0.02,
  torchLength: 0.15,
  torchOffsetZ: 0.25,

  // --- COMPONENTS TO BE DETAILED ---
  // FastenersAndBrackets: PLACEHOLDER
  // SensorAssembly: ESTIMATE
  // ElectronicsHousing: ESTIMATE
};
