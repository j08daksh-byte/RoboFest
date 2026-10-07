export const robotConfig = {
  // Main chassis/body
  bodyLength: 0.8, // X axis (actually, body is parallel to Y mostly? wait, if arm extends in +X, and robot moves in Y, track length is along Y)
  // Let's assume Track Length is along Y. 
  // Wait, if it's a vertical climber cutting along Y, tracks usually run parallel to Y.
  // So Length = Y, Width = X, Height = Z.
  bodyLengthY: 0.8,
  bodyWidthX: 0.5,
  bodyHeightZ: 0.15,

  // Tracks
  trackWidthX: 0.12,
  trackLengthY: 0.9,
  trackHeightZ: 0.18,

  // Magnets
  magnetCountPerTrack: 10,
  magnetRadius: 0.03,
  magnetThickness: 0.01,

  // Electromagnet
  electromagnetRadius: 0.1,
  electromagnetHeightZ: 0.05,

  // Upper Structure (mounted above the body)
  structureHeightZ: 0.2, // How high above the body
  structureWidthX: 0.6,
  structureLengthY: 0.5,

  // Cutting Arm
  armMaxExtensionX: 1.0,
  armMinExtensionX: 0.4,
  armMaxPositionY: 0.3, // relative to upper structure center
  armMinPositionY: -0.3,
  armThickness: 0.05,

  // Torch
  torchOffsetZ: 0.25, // Distance from arm to ship hull
  torchRadius: 0.02,
  torchLength: 0.15,
  
  // Locomotion Boundaries & Offsets
  hullRadius: 25,
  hullCenterZ: -25.05,
  hullSurfaceOffsetZ: 0, // Robot operates at local Z=0 where tracks touch
  maxPositionX: 18.0,
  minPositionX: -2.0,
  maxPositionY: 29.0,
  minPositionY: -29.0,
  moveSpeed: 0.8, // m/s
};
