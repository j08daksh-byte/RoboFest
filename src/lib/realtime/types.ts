export type RealtimeEventType =
  | 'RUNTIME_STATE_UPDATED'
  | 'COMMAND_STATUS_CHANGED'
  | 'MISSION_UPDATED'
  | 'CUT_UPDATED'
  | 'TELEMETRY_UPDATED'
  | 'SAFETY_CHANGED'
  | 'HEALTH_UPDATED'
  | 'EVENT_CREATED';

export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType;
  timestamp: string;
  source: string;
  revision?: number;
  resourceId?: string;
  payload: T;
}
