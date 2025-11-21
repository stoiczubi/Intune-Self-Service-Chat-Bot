import React from 'react';
import { Device, DeviceOS } from '../types';

interface DeviceSelectorProps {
  devices: Device[];
  onSelect: (device: Device) => void;
  isLoading: boolean;
}

const getIconForOS = (os: DeviceOS) => {
  switch (os) {
    case DeviceOS.Windows:
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4h-13.05M0 12.552L9.75 12.45v9.45L0 20.55m10.949-9.602L24 24V12.55h-13.05" />
        </svg>
      );
    case DeviceOS.iOS:
    case DeviceOS.macOS:
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.335 16.064c-1.029 1.505-2.111 2.996-3.795 3.024-1.658.027-2.167-.993-4.047-.993-1.893 0-2.475.979-4.062 1.007-1.641.027-2.878-1.658-3.92-3.16-2.14-3.091-3.774-8.732-1.579-12.543 1.084-1.878 3.022-3.065 5.132-3.092 1.63-.027 3.168 1.108 4.163 1.108.994 0 2.85-1.368 4.81-1.162 1.641.068 3.114.673 4.12 1.658-3.622 2.167-3.034 8.718 1.478 10.153zm-3.46-13.19c.877-1.083 1.465-2.575 1.302-4.076-1.261.055-2.797.85-3.702 1.908-.811.936-1.519 2.451-1.329 3.886 1.41.109 2.851-.632 3.729-1.718z"/>
        </svg>
      );
    case DeviceOS.Android:
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2.335 19.564c0 .48.35.874.818.948l.138.012c.478 0 .873-.35.947-.818l.012-.138v-3.252h15.502v3.252c0 .48.35.874.818.948l.138.012c.478 0 .873-.35.947-.818l.012-.138v-3.666a2.894 2.894 0 0 0-2.892-2.892h-.362v-5.38l1.76-3.05a.966.966 0 0 0-.192-1.26.96.96 0 0 0-1.26.193l-1.78 3.084c-1.472-.664-3.116-1.03-4.847-1.03-1.731 0-3.376.366-4.847 1.03l-1.78-3.083A.96.96 0 0 0 3.355 3.6a.967.967 0 0 0-.192 1.26l1.76 3.05v5.38h-.362a2.894 2.894 0 0 0-2.893 2.892v3.382zm4.295-10.24c.528 0 .956.427.956.955 0 .528-.428.956-.956.956a.956.956 0 0 1-.956-.956c0-.528.428-.955.956-.955zm10.742 0c.528 0 .956.427.956.955 0 .528-.428.956-.956.956a.956.956 0 0 1-.956-.956c0-.528.428-.955.956-.955z" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
  }
};

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({ devices, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (devices.length === 0) {
    return <div className="p-4 text-gray-500 bg-white rounded-lg">No devices found.</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
        Select a device
      </div>
      <ul className="divide-y divide-gray-100">
        {devices.map((device) => (
          <li 
            key={device.id} 
            onClick={() => onSelect(device)}
            className="p-4 hover:bg-purple-50 cursor-pointer transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-full ${device.isCompliant ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {getIconForOS(device.os)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{device.deviceName}</p>
                <p className="text-xs text-gray-500">{device.os} • SN: {device.serialNumber}</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
        ))}
      </ul>
    </div>
  );
};