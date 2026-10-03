import { MissionState, MissionStatus } from '@/lib/domain';

export function validateMissionPayload(payload: unknown): { isValid: boolean; data?: Partial<MissionState>; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Payload must be an object' };
  }

  // Explicit field extraction (No mass assignment)
  const safeData: Partial<MissionState> = {
    shipName: typeof (payload as Record<string, unknown>).shipName === 'string' ? (payload as Record<string, unknown>).shipName as string : undefined,
    objective: typeof (payload as Record<string, unknown>).objective === 'string' ? (payload as Record<string, unknown>).objective as string : undefined,
    hullSection: typeof (payload as Record<string, unknown>).hullSection === 'string' ? (payload as Record<string, unknown>).hullSection as string : undefined,
    status: Object.values(MissionStatus).includes((payload as Record<string, unknown>).status as MissionStatus) ? (payload as Record<string, unknown>).status as MissionStatus : undefined,
  };

  if (!safeData.shipName || !safeData.objective || !safeData.hullSection) {
    return { isValid: false, error: 'Missing required fields: shipName, objective, hullSection' };
  }

  return { isValid: true, data: safeData };
}

export function validateEventPayload(payload: unknown): { isValid: boolean; data?: Record<string, unknown>; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Payload must be an object' };
  }

  const safeData = {
    category: typeof (payload as Record<string, unknown>).category === 'string' ? (payload as Record<string, unknown>).category : undefined,
    message: typeof (payload as Record<string, unknown>).message === 'string' ? (payload as Record<string, unknown>).message : undefined,
    severity: typeof (payload as Record<string, unknown>).severity === 'string' ? (payload as Record<string, unknown>).severity : undefined,
    timestamp: typeof (payload as Record<string, unknown>).timestamp === 'string' ? (payload as Record<string, unknown>).timestamp : new Date().toISOString(),
    missionId: typeof (payload as Record<string, unknown>).missionId === 'string' ? (payload as Record<string, unknown>).missionId : undefined,
  };

  if (!safeData.category || !safeData.message || !safeData.severity) {
    return { isValid: false, error: 'Missing required fields: category, message, severity' };
  }

  return { isValid: true, data: safeData };
}

export function validateCutPayload(payload: unknown, missionId: string): { isValid: boolean; data?: Record<string, unknown>; error?: string } {
  if (!missionId) {
    return { isValid: false, error: 'Missing missionId in path' };
  }
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Payload must be an object' };
  }
  
  const safeData = {
    missionId,
    geometryJson: typeof (payload as Record<string, unknown>).geometryJson === 'string' ? (payload as Record<string, unknown>).geometryJson : undefined,
  };

  if (!safeData.geometryJson) {
    return { isValid: false, error: 'Missing required field: geometryJson' };
  }

  return { isValid: true, data: safeData };
}
