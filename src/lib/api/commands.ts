export type CommandType = 'UPDATE_LOCOMOTION' | 'SET_ARM_POSITION' | 'SET_TORCH' | 'SET_ELECTROMAGNET' | 'TRIGGER_EMERGENCY_STOP';

export interface BaseCommand {
  type: CommandType;
  id: string;
  timestamp: string;
  source: string;
}

export interface LocomotionCommand extends BaseCommand {
  type: 'UPDATE_LOCOMOTION';
  payload: {
    x: number;
    y: number;
    trackOffsetDelta: number;
  };
}

export interface ArmPositionCommand extends BaseCommand {
  type: 'SET_ARM_POSITION';
  payload: {
    xExtension: number;
    yPosition: number;
  };
}

export interface TorchCommand extends BaseCommand {
  type: 'SET_TORCH';
  payload: {
    enabled: boolean;
  };
}

export interface ElectromagnetCommand extends BaseCommand {
  type: 'SET_ELECTROMAGNET';
  payload: {
    enabled: boolean;
  };
}

export interface EmergencyStopCommand extends BaseCommand {
  type: 'TRIGGER_EMERGENCY_STOP';
}

export type RobotCommand = LocomotionCommand | ArmPositionCommand | TorchCommand | ElectromagnetCommand | EmergencyStopCommand;

export type CommandResultStatus = 'ACCEPTED' | 'REJECTED' | 'FAILED' | 'EXECUTED' | 'EMERGENCY_STOPPED';

export interface CommandResult {
  commandId: string;
  status: CommandResultStatus;
  reason?: string;
  timestamp: string;
}

export function validateCommand(cmd: any): { isValid: boolean; error?: string } {
  if (!cmd || typeof cmd !== 'object') return { isValid: false, error: 'Command must be an object' };
  if (typeof cmd.id !== 'string') return { isValid: false, error: 'Missing or invalid command id' };
  if (typeof cmd.timestamp !== 'string') return { isValid: false, error: 'Missing or invalid timestamp' };
  if (typeof cmd.source !== 'string') return { isValid: false, error: 'Missing or invalid source' };
  
  switch (cmd.type) {
    case 'UPDATE_LOCOMOTION':
      if (!cmd.payload || typeof cmd.payload.x !== 'number' || typeof cmd.payload.y !== 'number' || typeof cmd.payload.trackOffsetDelta !== 'number') {
        return { isValid: false, error: 'Invalid payload for UPDATE_LOCOMOTION' };
      }
      break;
    case 'SET_ARM_POSITION':
      if (!cmd.payload || typeof cmd.payload.xExtension !== 'number' || typeof cmd.payload.yPosition !== 'number') {
        return { isValid: false, error: 'Invalid payload for SET_ARM_POSITION' };
      }
      break;
    case 'SET_TORCH':
    case 'SET_ELECTROMAGNET':
      if (!cmd.payload || typeof cmd.payload.enabled !== 'boolean') {
        return { isValid: false, error: `Invalid payload for ${cmd.type}` };
      }
      break;
    case 'TRIGGER_EMERGENCY_STOP':
      break;
    default:
      return { isValid: false, error: 'Unknown command type' };
  }
  
  return { isValid: true };
}
