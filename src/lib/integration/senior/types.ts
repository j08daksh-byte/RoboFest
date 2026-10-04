export interface SeniorShipResponse {
  id: string;
  name: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  isSeedData?: boolean;
}

export interface SeniorPartPayload {
  operationId: string;
  localCutId: string;
  completionDate: string;
  status: string;
  // Note: Complex geometry is deliberately omitted for Senior API.
}

export interface SeniorMaintenancePayload {
  faultId: string;
  timestamp: string;
  severity: string;
  category: string;
  description: string;
}

export interface SeniorOperationPayload {
  status: string; // e.g., IN_PROGRESS, COMPLETED
}

export interface SyncTask {
  id: string;
  type: 'PART_EXPORT' | 'MAINTENANCE_LOG' | 'OPERATION_UPDATE';
  payload: any;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  createdAt: string;
}
