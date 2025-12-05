// Reexport the native module. On web, it will be resolved to ExpoSmsManagerModule.web.ts
// and on native platforms to ExpoSmsManagerModule.ts
// export { default } from './src/ExpoSmsManagerModule';
// export { default as ExpoSmsManagerView } from './src/ExpoSmsManagerView';
// export * from  './src/ExpoSmsManager.types';

import { requireNativeModule } from "expo";

export type SmsManagerResult = {
  status: 'sent' | 'cancelled' | 'failed' | 'unknown';
  message?: string;
};

export type SimInfo = {
  subscriptionId: number;
  displayName: string;
  carrierName: string;
  simSlotIndex: number;
};

export interface ExpoSmsManagerModule {
  getAvailableSimsAsync(): Promise<SimInfo[]>;
  sendSms(
    phoneNumbers: string[],
    message: string,
    subscriptionId: number | null
  ): Promise<SmsManagerResult>;
}

const NativeModule = requireNativeModule<ExpoSmsManagerModule>("ExpoSmsManager");

export async function getAvailableSimsAsync(): Promise<SimInfo[]> {
  return await NativeModule.getAvailableSimsAsync();
}
export async function sendSms(
  numbers: string[],
  message: string,
  subscriptionId: number | null = null
): Promise<SmsManagerResult> {
  return await NativeModule.sendSms(numbers, message, subscriptionId);
}
