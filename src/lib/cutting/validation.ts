import { CutGeometry, CutMaterial, CutEstimate, CutValidationResult, CutRiskLevel, Point2D } from './domain';
import { SafetyState, SafetyLevel } from '../domain'; // from platformStore domain

function distance(p1: Point2D, p2: Point2D) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// SIMULATION ESTIMATES
export function estimateCut(geometry: CutGeometry, material: CutMaterial): CutEstimate {
  let length = 0;
  let area: number | null = null;

  switch (geometry.type) {
    case 'STRAIGHT':
      length = distance(geometry.start, geometry.end);
      break;
    case 'RECTANGLE':
      length = (geometry.width + geometry.height) * 2;
      area = geometry.width * geometry.height;
      break;
    case 'CIRCLE':
      length = 2 * Math.PI * geometry.radius;
      area = Math.PI * Math.pow(geometry.radius, 2);
      break;
    case 'SLOT':
      const linear = distance(geometry.start, geometry.end);
      length = linear * 2 + Math.PI * geometry.width;
      area = linear * geometry.width + Math.PI * Math.pow(geometry.width / 2, 2);
      break;
    case 'L_SHAPE':
      length = distance(geometry.corner, geometry.leg1) + distance(geometry.corner, geometry.leg2);
      break;
    case 'CUSTOM_POLYGON':
      if (geometry.vertices.length > 1) {
        for (let i = 0; i < geometry.vertices.length; i++) {
          const p1 = geometry.vertices[i];
          const p2 = geometry.vertices[(i + 1) % geometry.vertices.length];
          length += distance(p1, p2);
        }
        // Simple shoelace for area
        let sArea = 0;
        for (let i = 0; i < geometry.vertices.length; i++) {
          const j = (i + 1) % geometry.vertices.length;
          sArea += geometry.vertices[i].x * geometry.vertices[j].y;
          sArea -= geometry.vertices[j].x * geometry.vertices[i].y;
        }
        area = Math.abs(sArea) / 2;
      }
      break;
    case 'MULTI_SEGMENT':
      for (const seg of geometry.segments) {
        length += distance(seg.start, seg.end);
      }
      break;
  }

  // Simulation estimates formulas
  const cuttingSpeedMPerSec = 0.005; // 5mm/sec
  const gasLitersPerMeter = 15;
  const energyKjPerMeter = 200;

  const panelMassKg = (area !== null && material.densityKgM3) 
    ? area * (material.thicknessMm / 1000) * material.densityKgM3 
    : null;

  return {
    cutLengthMeters: length,
    estimatedDurationSeconds: length / cuttingSpeedMPerSec,
    gasRequirementLiters: length * gasLitersPerMeter,
    energyRequirementKj: length * energyKjPerMeter,
    panelMassKg
  };
}

// VALIDATION ENGINE
export function validateCut(geometry: CutGeometry, safetyState: SafetyState): CutValidationResult {
  const errors: string[] = [];

  // 1. Geometric Validation
  switch (geometry.type) {
    case 'STRAIGHT':
      if (geometry.start.x === geometry.end.x && geometry.start.y === geometry.end.y) {
        errors.push("Straight cut has identical start and end points");
      }
      break;
    case 'RECTANGLE':
      if (geometry.width <= 0 || geometry.height <= 0) {
        errors.push("Rectangle must have positive width and height");
      }
      break;
    case 'CIRCLE':
      if (geometry.radius <= 0) {
        errors.push("Circle must have a positive radius");
      }
      break;
    case 'SLOT':
      if (geometry.width <= 0) {
        errors.push("Slot must have a positive width");
      }
      if (geometry.start.x === geometry.end.x && geometry.start.y === geometry.end.y) {
        errors.push("Slot length must be greater than zero");
      }
      break;
    case 'L_SHAPE':
      if (distance(geometry.corner, geometry.leg1) === 0 || distance(geometry.corner, geometry.leg2) === 0) {
        errors.push("L-Shape legs must have non-zero length");
      }
      break;
    case 'CUSTOM_POLYGON':
      if (geometry.vertices.length < 3) {
        errors.push("Polygon must have at least 3 vertices");
      }
      break;
    case 'MULTI_SEGMENT':
      if (geometry.segments.length === 0) {
        errors.push("Multi-segment must have at least one segment");
      }
      break;
  }

  // 2. Reach Validation Boundary (SIMULATED configuration)
  // Assuming robot can reach x in [-5, 5] and y in [-2, 2] from its origin
  // We'll simplify this by just checking if ANY point is drastically out of bounds
  let reachStatus = 'REACHABLE' as 'REACHABLE' | 'OUT_OF_REACH' | 'UNKNOWN';
  const getPoints = (): Point2D[] => {
    switch (geometry.type) {
      case 'STRAIGHT': return [geometry.start, geometry.end];
      case 'RECTANGLE': return [
        geometry.origin, 
        { x: geometry.origin.x + geometry.width, y: geometry.origin.y + geometry.height }
      ];
      case 'CIRCLE': return [
        { x: geometry.center.x - geometry.radius, y: geometry.center.y - geometry.radius },
        { x: geometry.center.x + geometry.radius, y: geometry.center.y + geometry.radius }
      ];
      case 'SLOT': return [geometry.start, geometry.end];
      case 'L_SHAPE': return [geometry.corner, geometry.leg1, geometry.leg2];
      case 'CUSTOM_POLYGON': return geometry.vertices;
      case 'MULTI_SEGMENT': return geometry.segments.flatMap(s => [s.start, s.end]);
    }
  };

  const pts = getPoints();
  for (const pt of pts) {
    if (Math.abs(pt.x) > 10 || Math.abs(pt.y) > 5) { // arbitrary reach bounds for simulation
      reachStatus = 'OUT_OF_REACH';
    }
  }

  // 3. Structural & Support Validation (Mock implementation for now)
  let structuralStatus = 'CLEAR' as 'CONFLICT' | 'CLEAR' | 'UNKNOWN';
  let supportStatus = 'CLEAR' as 'CONFLICT' | 'CLEAR' | 'UNKNOWN';
  
  // Deterministic demo logic: if any point x > 8 it hits a structural rib
  if (pts.some(p => p.x > 8 && p.x < 9)) {
    structuralStatus = 'CONFLICT';
  }
  // Deterministic demo logic: if any point y < -4 it hits a support cable
  if (pts.some(p => p.y < -4)) {
    supportStatus = 'CONFLICT';
  }

  // 4. Safety Validation
  let safetyStatus: 'SAFE_TO_PLAN' | 'BLOCKED_BY_SAFETY' | 'WARNING' = 'SAFE_TO_PLAN';
  if (!safetyState.torchPermission || !safetyState.movementPermission) {
    safetyStatus = 'BLOCKED_BY_SAFETY';
  } else if (safetyState.level === SafetyLevel.WARNING) {
    safetyStatus = 'WARNING';
  }

  // 5. Risk Calculation
  let overallRisk: CutRiskLevel = 'LOW';
  
  if (errors.length > 0 || reachStatus === 'OUT_OF_REACH' || structuralStatus === 'CONFLICT' || supportStatus === 'CONFLICT' || safetyStatus === 'BLOCKED_BY_SAFETY') {
    overallRisk = 'BLOCKED';
  } else if (safetyStatus === 'WARNING' || structuralStatus === 'UNKNOWN' || reachStatus === 'UNKNOWN') {
    overallRisk = 'MEDIUM';
  }

  return {
    isValidGeometry: errors.length === 0,
    geometryErrors: errors,
    reachStatus,
    structuralStatus,
    supportStatus,
    safetyStatus,
    overallRisk
  };
}
