import { Redirect } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';

export default function Index() {
  const onboardingComplete = useSettingsStore((s) => s.settings.onboardingComplete);
  if (onboardingComplete) {
    return <Redirect href="/(tabs)/" />;
  }
  return <Redirect href="/(onboarding)/welcome" />;
}
