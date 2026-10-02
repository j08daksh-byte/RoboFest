export type CutShapeType = 'STRAIGHT' | 'RECTANGLE' | 'CIRCLE' | 'SLOT' | 'L_SHAPE' | 'CUSTOM_POLYGON' | 'MULTI_SEGMENT';

export interface Point2D {
  x: number;
  y: number;
}

export type CutGeometry = 
  | { type: 'STRAIGHT'; start: Point2D; end: Point2D }
  | { type: 'RECTANGLE'; origin: Point2D; width: number; height: number }
  | { type: 'CIRCLE'; center: Point2D; radius: number }
  | { type: 'SLOT'; start: Point2D; end: Point2D; width: number }
  | { type: 'L_SHAPE'; corner: Point2D; leg1: Point2D; leg2: Point2D }
  | { type: 'CUSTOM_POLYGON'; vertices: Point2D[] }
  | { type: 'MULTI_SEGMENT'; segments: Array<{ start: Point2D; end: Point2D }> };

export interface CutMaterial {
  name: string;
  thicknessMm: number;
  densityKgM3?: number;
  tensileStrengthMpa?: number;
}

export type ValidationStatus = 'REACHABLE' | 'OUT_OF_REACH' | 'UNKNOWN' | 'CONFLICT' | 'CLEAR' | 'SAFE_TO_PLAN' | 'BLOCKED_BY_SAFETY' | 'WARNING';
export type CutRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';

export interface CutValidationResult {
  isValidGeometry: boolean;
  geometryErrors: string[];
  reachStatus: 'REACHABLE' | 'OUT_OF_REACH' | 'UNKNOWN';
  structuralStatus: 'CONFLICT' | 'CLEAR' | 'UNKNOWN';
  supportStatus: 'CONFLICT' | 'CLEAR' | 'UNKNOWN';
  safetyStatus: 'SAFE_TO_PLAN' | 'BLOCKED_BY_SAFETY' | 'WARNING';
  overallRisk: CutRiskLevel;
}

export interface CutEstimate {
  cutLengthMeters: number;
  estimatedDurationSeconds: number;
  gasRequirementLiters: number;
  energyRequirementKj: number;
  panelMassKg: number | null; // null if area cannot be determined
}

export type CutApprovalState = 'DRAFT' | 'VALIDATING' | 'VALID' | 'WARNING' | 'BLOCKED' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'CANCELLED';

export interface CutDefinition {
  id: string;
  missionId?: string;
  sequenceNumber: number;
  geometry: CutGeometry;
  material: CutMaterial;
  estimate: CutEstimate | null;
  validation: CutValidationResult | null;
  approvalState: CutApprovalState;
  createdAt: string;
  updatedAt: string;
}
