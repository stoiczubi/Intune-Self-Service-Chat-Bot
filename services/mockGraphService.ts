import { Device, DeviceOS } from '../types';

/**
 * This service mocks the Microsoft Graph API calls.
 * In the production Tauri app, you would replace these delays with real axios/fetch calls
 * to https://graph.microsoft.com/v1.0/...
 * using the token acquired from MSAL.
 */

const MOCK_DEVICES: Device[] = [
  {
    id: 'dev-001',
    deviceName: 'MDLZ-US-LPT-994',
    os: DeviceOS.Windows,
    isCompliant: true,
    lastSync: new Date().toISOString(),
    serialNumber: 'H844-2221'
  },
  {
    id: 'dev-002',
    deviceName: 'John\'s iPhone 14',
    os: DeviceOS.iOS,
    isCompliant: true,
    lastSync: new Date().toISOString(),
    serialNumber: 'DX8842A'
  },
  {
    id: 'dev-003',
    deviceName: 'Pixel 7 Work',
    os: DeviceOS.Android,
    isCompliant: false,
    lastSync: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    serialNumber: 'G022155'
  }
];

export const getManagedDevices = async (): Promise<Device[]> => {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 1000));
  return MOCK_DEVICES;
};

export const getBitLockerKey = async (deviceId: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  if (deviceId === 'dev-001') {
    return '443215-112233-556677-889900-112233-445566-778899-001122';
  }
  throw new Error("No BitLocker key found for this device type.");
};

export const wipeDevice = async (deviceId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log(`[GRAPH API] Wiping device ${deviceId}`);
  return true;
};

export const resetPasscode = async (deviceId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log(`[GRAPH API] Resetting passcode for device ${deviceId}`);
  return true;
};