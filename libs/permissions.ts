import { canScheduleExactAlarms, requestExactAlarmPermission } from '@/modules/expo-sms-manager';
import { PermissionsAndroid, Platform } from 'react-native';
import i18n from './i18n';

export type PermissionType = 'SEND' | 'SCHEDULE';

/**
 * Ensures all necessary permissions are granted for a given action.
 * Shows alerts and requests permissions if needed.
 */
export async function ensureAllPermissions(
    type: PermissionType,
    showAlert: (title: string, message: string, buttons?: any[], type?: any) => void
): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    // 1. Always check SEND_SMS
    const smsGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);
    if (!smsGranted) {
        const request = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.SEND_SMS,
            {
                title: i18n.t('groupChat.permissionTitle'),
                message: i18n.t('groupChat.permissionMessage'),
                buttonPositive: i18n.t('common.allow') || 'Autoriser',
                buttonNegative: i18n.t('common.deny') || 'Refuser',
            }
        );
        if (request !== PermissionsAndroid.RESULTS.GRANTED) {
            showAlert(
                i18n.t('common.error'),
                i18n.t('groupChat.permissionDenied'),
                [],
                'error'
            );
            return false;
        }
    }

    // 2. If SCHEDULE, also check Exact Alarm (Android 12+) and Notifications (Android 13+)
    if (type === 'SCHEDULE') {
        // Check Alarm Permission
        const hasAlarmPermission = await canScheduleExactAlarms();
        if (!hasAlarmPermission) {
            const retry = await new Promise<boolean>((resolve) => {
                showAlert(
                    i18n.t('groupChat.exactAlarmPermissionTitle') || "Planification restreinte",
                    i18n.t('groupChat.exactAlarmPermissionMessage') || "L'application doit être autorisée à programmer des alarmes précises. Voulez-vous ouvrir les paramètres ?",
                    [
                        {
                            text: i18n.t('common.cancel'),
                            style: 'cancel',
                            onPress: () => resolve(false)
                        },
                        {
                            text: i18n.t('common.settings'),
                            onPress: async () => {
                                await requestExactAlarmPermission();
                                resolve(false);
                            }
                        }
                    ],
                    'info'
                );
            });
            if (!retry) return false;
        }

        // Check Notification Permission (Android 13+)
        if (Platform.Version >= 33) {
            const hasNotificationPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            if (!hasNotificationPermission) {
                const request = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
                if (request !== PermissionsAndroid.RESULTS.GRANTED) {
                    // Notifications aren't strictly fatal for scheduling, but the user wants to be asked.
                    // We can let it pass if NOT granted, or block it. The user said "ensure necessary permissions".
                    // I'll block it to follow the user's strict instruction.
                    showAlert(i18n.t('common.error'), i18n.t('groupChat.notificationPermissionDenied') || "Permission notification refusée. Le rappel ne fonctionnera pas.", [], 'error');
                    return false;
                }
            }
        }
    }

    return true;
}
