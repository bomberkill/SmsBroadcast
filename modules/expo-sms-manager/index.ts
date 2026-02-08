// Reexport the native module. On web, it will be resolved to ExpoSmsManagerModule.web.ts
// and on native platforms to ExpoSmsManagerModule.ts
// export { default } from './src/ExpoSmsManagerModule';
// export { default as ExpoSmsManagerView } from './src/ExpoSmsManagerView';
// export * from  './src/ExpoSmsManager.types';

import { EventEmitter, requireNativeModule } from "expo-modules-core";

export type SmsManagerResult = {
  status: 'sent' | 'cancelled' | 'failed' | 'queued' | 'scheduled' | 'unknown';
  message?: string;
  errorCode?: string;
};

export type SimInfo = {
  subscriptionId: number;
  displayName: string;
  carrierName: string;
  simSlotIndex: number;
};

export type SmsStatusUpdateEvent = {
  messageId: string;
  phoneNumber: string;
  status: 'sent' | 'failed' | 'delivered';
  errorCode?: string;
};

export type SmsManagerEvents = {
  onSmsStatusUpdate: (event: SmsStatusUpdateEvent) => void;
  onSmsDeliveryUpdate: (event: SmsStatusUpdateEvent) => void;
};

export interface ExpoSmsManagerModule {
  getAvailableSimsAsync(): Promise<SimInfo[]>;
  sendSms(
    messageId: string,
    phoneNumbers: string[],
    message: string,
    subscriptionId: number | null
  ): Promise<SmsManagerResult>;
  scheduleSms(
    messageId: string,
    groupId: string,
    groupName: string,
    baseMessage: string,
    personalizedMessages: Record<string, string>,
    timestamp: number,
    subscriptionId: number | null
  ): Promise<SmsManagerResult>;
  cancelScheduledSms(messageId: string): Promise<boolean>;
  canScheduleExactAlarms(): Promise<boolean>;
  requestExactAlarmPermission(): Promise<void>;
}

const NativeModule = requireNativeModule<ExpoSmsManagerModule>("ExpoSmsManager");
// The native module is already an EventEmitter, so we can use it directly.
// Note: EventEmitter type is the Constructor type in expo-modules-core, so we need InstanceType.
export const smsEventEmitter = NativeModule as unknown as InstanceType<EventEmitter<SmsManagerEvents>>;

export async function getAvailableSimsAsync(): Promise<SimInfo[]> {
  return await NativeModule.getAvailableSimsAsync();
}

export async function sendSms(
  messageId: string,
  numbers: string[],
  message: string,
  subscriptionId: number | null = null
): Promise<SmsManagerResult> {
  return await NativeModule.sendSms(messageId, numbers, message, subscriptionId);
}

export async function scheduleSms(
  messageId: string,
  groupId: string,
  groupName: string,
  baseMessage: string,
  personalizedMessages: Record<string, string>,
  timestamp: number,
  subscriptionId: number | null = null
): Promise<SmsManagerResult> {
  return await NativeModule.scheduleSms(messageId, groupId, groupName, baseMessage, personalizedMessages, timestamp, subscriptionId);
}

export async function cancelScheduledSms(messageId: string): Promise<boolean> {
  return await NativeModule.cancelScheduledSms(messageId);
}

export async function canScheduleExactAlarms(): Promise<boolean> {
  return await NativeModule.canScheduleExactAlarms();
}

export async function requestExactAlarmPermission(): Promise<void> {
  return await NativeModule.requestExactAlarmPermission();
}
