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
    type: typeof (payload as Record<string, unknown>).type === 'string' ? (payload as Record<string, unknown>).type : undefined,
    message: typeof (payload as Record<string, unknown>).message === 'string' ? (payload as Record<string, unknown>).message : undefined,
    severity: typeof (payload as Record<string, unknown>).severity === 'string' ? (payload as Record<string, unknown>).severity : undefined,
    source: typeof (payload as Record<string, unknown>).source === 'string' ? (payload as Record<string, unknown>).source : 'SYSTEM',
    timestamp: typeof (payload as Record<string, unknown>).timestamp === 'string' ? (payload as Record<string, unknown>).timestamp : new Date().toISOString(),
    missionId: typeof (payload as Record<string, unknown>).missionId === 'string' ? (payload as Record<string, unknown>).missionId : undefined,
    cutId: typeof (payload as Record<string, unknown>).cutId === 'string' ? (payload as Record<string, unknown>).cutId : undefined,
    commandId: typeof (payload as Record<string, unknown>).commandId === 'string' ? (payload as Record<string, unknown>).commandId : undefined,
    robotId: typeof (payload as Record<string, unknown>).robotId === 'string' ? (payload as Record<string, unknown>).robotId : undefined,
    metadata: typeof (payload as Record<string, unknown>).metadata === 'string' ? (payload as Record<string, unknown>).metadata : undefined,
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
    name: typeof (payload as Record<string, unknown>).name === 'string' ? (payload as Record<string, unknown>).name : undefined,
    type: typeof (payload as Record<string, unknown>).type === 'string' ? (payload as Record<string, unknown>).type : undefined,
    photoPlanJson: typeof (payload as Record<string, unknown>).photoPlanJson === 'string' ? (payload as Record<string, unknown>).photoPlanJson : undefined,
    normalizedJson: typeof (payload as Record<string, unknown>).normalizedJson === 'string' ? (payload as Record<string, unknown>).normalizedJson : undefined,
    worldJson: typeof (payload as Record<string, unknown>).worldJson === 'string' ? (payload as Record<string, unknown>).worldJson : undefined,
    panelId: typeof (payload as Record<string, unknown>).panelId === 'string' ? (payload as Record<string, unknown>).panelId : undefined,
  };

  if (!safeData.type || !['OPEN_PATH', 'CLOSED_LOOP'].includes(safeData.type as string)) {
    return { isValid: false, error: 'Missing or invalid field: type' };
  }

  if (!safeData.photoPlanJson && !safeData.normalizedJson && !safeData.worldJson) {
    return { isValid: false, error: 'Cut must have geometry definition' };
  }

  return { isValid: true, data: safeData };
}
