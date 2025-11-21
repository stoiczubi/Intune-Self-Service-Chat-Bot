export enum DeviceOS {
  Windows = 'Windows',
  iOS = 'iOS',
  Android = 'Android',
  macOS = 'macOS'
}

export enum ActionType {
  NONE = 'NONE',
  GET_BITLOCKER = 'GET_BITLOCKER',
  WIPE = 'WIPE',
  RESET_PASSCODE = 'RESET_PASSCODE',
  RETIRE = 'RETIRE'
}

export interface Device {
  id: string;
  deviceName: string;
  os: DeviceOS;
  isCompliant: boolean;
  lastSync: string;
  serialNumber: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  relatedAction?: ActionType; // If the bot suggests an action
  deviceList?: Device[]; // If the bot presents devices to choose from
  requiresSelection?: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string;
}

// Gemini Response Schema
export interface IntentResponse {
  intent: ActionType;
  reasoning: string;
  confirmationMessage: string;
}