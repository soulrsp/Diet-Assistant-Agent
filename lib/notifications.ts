import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ReminderSettings } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const DAILY_REMINDER_ID = 'daily-diet-reminder';

export const isNotificationSupportedPlatform = Platform.OS !== 'web';

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function applyReminderSchedule(settings: ReminderSettings): Promise<void> {
  // 웹은 브라우저를 열어둬야만 알림이 오고, iOS Safari는 지원이 거의 없어 시도하지 않는다.
  if (!isNotificationSupportedPlatform) return;

  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});

  if (!settings.enabled) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: '오늘 기록 잊지 않으셨나요?',
      body: '눈바디 사진과 식단을 기록해보세요.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.hour,
      minute: settings.minute,
    },
  });
}
