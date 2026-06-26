import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, parseISO } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound:  true,
    shouldSetBadge:   false,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

const CHANNEL_ID = 'cycle-reminders';

/** Android requires a channel for notifications to display (API 26+). Safe to call repeatedly. */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Cycle Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#A855F7',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted' && current.canAskAgain !== false) {
    const requested = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    status = requested.status;
  }
  return status === 'granted';
}

/** Check whether notifications are already granted, without prompting the user. */
export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

interface ReminderConfig {
  periodReminders: boolean;
  ovulationReminders: boolean;
  waterReminders: boolean;
  logReminders: boolean;
  nextPeriodDate?: string | null;
  ovulationDate?: string | null;
  fertileStartDate?: string | null;
  daysBefore?: number;
}

/** Daily water reminder times (24h). */
const WATER_TIMES: { hour: number; minute: number }[] = [
  { hour: 11, minute: 0 },
  { hour: 17, minute: 0 },
];

/** Daily symptom-log reminder time (24h). */
const LOG_TIME = { hour: 20, minute: 0 };

/** Schedule a one-off reminder at a specific date (skipped if already past). */
async function scheduleOnce(date: Date, title: string, body: string, type: string): Promise<void> {
  if (date <= new Date()) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { type } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: CHANNEL_ID,
    },
  });
}

/** Schedule a reminder that repeats every day at the given time. */
async function scheduleDaily(hour: number, minute: number, title: string, body: string, type: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { type } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

const atHour = (iso: string, hour: number): Date => {
  const d = parseISO(iso);
  d.setHours(hour, 0, 0, 0);
  return d;
};

/**
 * Single source of truth for scheduled reminders.
 * Always clears existing reminders first, then schedules whatever is enabled.
 * Call this whenever reminder settings OR cycle dates change.
 */
export async function syncReminders({
  periodReminders,
  ovulationReminders,
  waterReminders,
  logReminders,
  nextPeriodDate,
  ovulationDate,
  fertileStartDate,
  daysBefore = 2,
}: ReminderConfig): Promise<void> {
  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  // ── Period: "coming soon" + "starts today" ──
  if (periodReminders && nextPeriodDate) {
    const soon = addDays(parseISO(nextPeriodDate), -daysBefore);
    soon.setHours(9, 0, 0, 0);
    await scheduleOnce(soon, 'Period Coming Soon 🌸', `Your period is expected in ${daysBefore} days. Stay prepared!`, 'period_soon');
    await scheduleOnce(atHour(nextPeriodDate, 9), 'Period Starts Today 🩸', 'Your period is expected to start today. Take care of yourself. 💗', 'period_start');
  }

  // ── Fertility: fertile window start + ovulation day ──
  if (ovulationReminders) {
    if (fertileStartDate) {
      await scheduleOnce(atHour(fertileStartDate, 9), 'Fertile Window Started 🌿', 'Your fertile window begins today — a higher chance to conceive.', 'fertile_start');
    }
    if (ovulationDate) {
      await scheduleOnce(atHour(ovulationDate, 9), 'Ovulation Day 💜', 'Today is your most fertile day.', 'ovulation_day');
    }
  }

  // ── Water: two repeating reminders every day ──
  if (waterReminders) {
    for (const { hour, minute } of WATER_TIMES) {
      await scheduleDaily(hour, minute, 'Time to Hydrate 💧', 'Drink a glass of water and log your intake.', 'water_reminder');
    }
  }

  // ── Daily log: nudge to record symptoms & mood ──
  if (logReminders) {
    await scheduleDaily(LOG_TIME.hour, LOG_TIME.minute, 'Daily Check-in 📝', 'How are you feeling today? Log your symptoms and mood.', 'log_reminder');
  }
}

interface ReminderPrefs {
  periodReminders: boolean;
  ovulationReminders: boolean;
  waterReminders: boolean;
  logReminders: boolean;
}

interface CycleDates {
  nextPeriodDate?: string | null;
  ovulationDate?: string | null;
  fertileWindowStart?: string | null;
}

/**
 * Silently re-schedule reminders from the current saved prefs + cycle dates.
 * Never prompts — only schedules if permission is already granted. Call this on
 * app launch and whenever the cycle dates change, so one-off period/ovulation
 * reminders re-arm for the upcoming cycle instead of dying after the first one.
 */
export async function reconcileReminders(prefs: ReminderPrefs, cycle: CycleDates | null): Promise<void> {
  const granted = await hasNotificationPermission();
  await syncReminders({
    periodReminders:    granted && prefs.periodReminders,
    ovulationReminders: granted && prefs.ovulationReminders,
    waterReminders:     granted && prefs.waterReminders,
    logReminders:       granted && prefs.logReminders,
    nextPeriodDate:     cycle?.nextPeriodDate,
    ovulationDate:      cycle?.ovulationDate,
    fertileStartDate:   cycle?.fertileWindowStart,
  });
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Fires a notification ~2s later so the user can confirm the pipeline works. */
export async function sendTestNotification(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Reminder 🔔',
      body: "You're all set — notifications are working!",
      data: { type: 'test' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: CHANNEL_ID,
    },
  });
  return true;
}
