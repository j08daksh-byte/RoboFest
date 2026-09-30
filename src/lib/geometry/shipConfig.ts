export const shipConfig = {
  lengthOverall: 120, // meters (Y axis)
  beam: 20,           // meters (X axis)
  hullHeight: 15,     // meters (Z axis)
  draft: 5,           // meters
  parallelMiddleBodyLength: 60, // length of the flat-ish side section
  bowLength: 30,
  sternLength: 30,
  robotSize: 0.6,     // Approximate visual scale for proxy
};

/**
 * Coordinate Convention:
 * X: Transverse (Starboard is +X, Port is -X)
 * Y: Longitudinal (Forward is +Y, Aft is -Y)
 * Z: Vertical (Up is +Z, Down is -Z, Keel is usually at Z=0)
 */
