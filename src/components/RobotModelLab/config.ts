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
  // --- NEW 6-TRANSMISSION CRAWLER STRUCTURE ---
  // CONFIRMED: 3 units per side (front, center, rear). 6 total.

  // ESTIMATE: Transmission Unit geometry
  transmissionOuterRadius: 0.08,
  transmissionThickness: 0.06,
  outerFlangeThickness: 0.015,
  recessDepth: 0.01,
  centralBoreRadius: 0.015,

  // ESTIMATE: Crawler Assembly positioning
  trackSpacingY: 0.45, // distance between left and right crawler centers
  crawlerLengthX: 0.8, // total length envelope
  frontRearSpacingX: 0.35, // distance from center to front/rear transmissions
  centerOffsetX: 0.0, // center transmission offset from center
  crawlerWidthY: 0.1, // width of the crawler belt/tracks
  beltThickness: 0.015, // thickness of the continuous belt

  // --- MAGNETS (Preserved placeholder) ---

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
