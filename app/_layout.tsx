import '../global.css';

import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import Constants from 'expo-constants';
import mobileAds from 'react-native-google-mobile-ads';
import { useSettingsStore } from '@/store/settingsStore';
import { useLogStore } from '@/store/logStore';
import { useCycleStore } from '@/store/cycleStore';
import { useSymptomsStore } from '@/store/symptomsStore';
import { ensureAndroidChannel, reconcileReminders } from '@/utils/notifications';
import LockScreen from '@/components/LockScreen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const settings = useSettingsStore((s) => s.settings);
  const isLoaded = useSettingsStore((s) => s.isLoaded);
  const loadEntries = useLogStore((s) => s.loadEntries);
  const loadSymptoms = useSymptomsStore((s) => s.loadSymptoms);
  const recompute = useCycleStore((s) => s.recompute);
  const cycleData = useCycleStore((s) => s.cycleData);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    loadSettings();
    loadEntries();
    loadSymptoms();
    // Register the notification handler + Android channel from app launch,
    // so reminders display even if the user never opens Settings this session.
    ensureAndroidChannel();
  }, []);

  // Initialize the Google Mobile Ads SDK once at launch. Skipped in Expo Go
  // (no native module there); failures are non-fatal — ads are non-essential.
  useEffect(() => {
    if (Constants.appOwnership === 'expo') return;
    try {
      mobileAds().initialize().catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (isLoaded && settings.lastPeriodDate) {
      recompute(settings.lastPeriodDate, settings.cycleLength, settings.periodLength);
    }
  }, [isLoaded, settings.lastPeriodDate, settings.cycleLength, settings.periodLength]);

  // Re-arm reminders on every launch (and whenever the cycle dates or prefs
  // change), so one-off period/ovulation reminders roll forward to the next
  // cycle instead of silently expiring. Runs silently — it never prompts.
  useEffect(() => {
    if (!isLoaded) return;
    reconcileReminders(
      {
        periodReminders:    settings.periodReminders,
        ovulationReminders: settings.ovulationReminders,
        waterReminders:     settings.waterReminders,
        logReminders:       settings.logReminders,
      },
      cycleData,
    );
  }, [
    isLoaded,
    cycleData,
    settings.periodReminders,
    settings.ovulationReminders,
    settings.waterReminders,
    settings.logReminders,
  ]);

  useEffect(() => {
    if (fontsLoaded && isLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoaded]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        if (settings.appLockEnabled) setIsUnlocked(false);
      }
    });
    return () => sub.remove();
  }, [settings.appLockEnabled]);

  if (!fontsLoaded || !isLoaded) return null;

  if (settings.onboardingComplete && settings.appLockEnabled && !isUnlocked) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LockScreen onUnlock={() => setIsUnlocked(true)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 180,
          contentStyle: { backgroundColor: '#FFF8FC' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="help" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="terms" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
