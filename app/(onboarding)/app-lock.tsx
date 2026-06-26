import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import OnboardingIcon from '@/components/onboarding/OnboardingIcon';
import InfoCard from '@/components/onboarding/InfoCard';
import GradientButton from '@/components/ui/GradientButton';
import { useSettingsStore } from '@/store/settingsStore';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';

const TITLE = '#1E1B4B';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function AppLockScreen() {
  const router = useRouter();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [selected, setSelected] = useState<'pin' | 'biometric' | null>(null);
  const [pinStep, setPinStep] = useState<'enter' | 'confirm' | null>(null);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  useEffect(() => {
    (async () => {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(has && enrolled);
    })();
  }, []);

  const skipLock = () => {
    updateSettings({ appLockEnabled: false, appLockType: null, pin: null });
    router.push('/(onboarding)/success');
  };

  const handlePrimary = () => {
    if (!selected) { skipLock(); return; }
    if (selected === 'pin') {
      setPinStep('enter');
    } else {
      updateSettings({ appLockEnabled: true, appLockType: 'biometric', pin: null });
      router.push('/(onboarding)/success');
    }
  };

  const handlePinConfirm = () => {
    if (pinStep === 'enter') {
      if (pin.length !== 4) return;
      setPinStep('confirm');
    } else {
      if (pinConfirm !== pin) {
        Alert.alert('PIN mismatch', 'PINs do not match. Try again.');
        setPinConfirm('');
        return;
      }
      updateSettings({ appLockEnabled: true, appLockType: 'pin', pin });
      router.push('/(onboarding)/success');
    }
  };

  /* ── PIN entry view ── */
  if (pinStep) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF4FA' }}>
        <OnboardingHeader currentStep={6} />
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, alignItems: 'center' }}>
          <OnboardingIcon icon="lock-closed" iconColor={COLORS.primary} bg="#EFE6FB" heart />
          <Text style={{ fontFamily: FONT.bold, fontSize: 26, color: TITLE, textAlign: 'center', marginBottom: 8 }}>
            {pinStep === 'enter' ? 'Set a 4-digit PIN' : 'Confirm your PIN'}
          </Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 40 }}>
            {pinStep === 'enter' ? 'You will use this PIN to unlock My Circle.' : 'Enter the same PIN again.'}
          </Text>
          <TextInput
            value={pinStep === 'enter' ? pin : pinConfirm}
            onChangeText={pinStep === 'enter' ? setPin : setPinConfirm}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            autoFocus
            style={{ fontFamily: FONT.bold, fontSize: 34, color: COLORS.primary, letterSpacing: 22, borderBottomWidth: 2, borderBottomColor: COLORS.primary, paddingBottom: 8, width: 180, textAlign: 'center', marginBottom: 'auto' }}
          />
          <GradientButton
            label={pinStep === 'enter' ? 'Next' : 'Set PIN'}
            onPress={handlePinConfirm}
            disabled={pinStep === 'enter' ? pin.length !== 4 : pinConfirm.length !== 4}
            hint
            style={{ width: '100%' }}
          />
        </View>
      </SafeAreaView>
    );
  }

  /* ── Lock option card ── */
  const LockOption = ({
    type, icon, title, subtitle, disabled = false,
  }: {
    type: 'pin' | 'biometric'; icon: IconName; title: string; subtitle: string; disabled?: boolean;
  }) => {
    const sel = selected === type;
    return (
      <TouchableOpacity
        onPress={() => !disabled && setSelected(sel ? null : type)}
        disabled={disabled}
        activeOpacity={0.85}
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 14, marginBottom: 14, borderWidth: 1.5, borderColor: sel ? COLORS.primary : 'transparent', opacity: disabled ? 0.45 : 1, ...CARD_SHADOW }}
      >
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#EFE6FB', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={26} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: TITLE, marginBottom: 2 }}>{title}</Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 }}>{subtitle}</Text>
        </View>
        <Ionicons
          name={sel ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={sel ? COLORS.primary : '#D8D2E0'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF4FA' }}>
      <OnboardingHeader currentStep={6} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>

          <OnboardingIcon icon="shield-half" iconColor={COLORS.primary} bg="#EFE6FB" heart />

          <Text style={{ fontFamily: FONT.bold, fontSize: 28, color: TITLE, textAlign: 'center', lineHeight: 36 }}>
            Keep your data{'\n'}private and secure
          </Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 28, paddingHorizontal: 8, lineHeight: 22 }}>
            Add a lock to protect your personal health data.
          </Text>

          <LockOption type="pin" icon="lock-closed-outline" title="PIN Lock" subtitle="Use a 4-digit PIN to access the app." />
          <LockOption
            type="biometric"
            icon="finger-print-outline"
            title="Fingerprint Lock"
            subtitle={biometricAvailable ? 'Use your fingerprint to quickly and securely access the app.' : 'Not available on this device.'}
            disabled={!biometricAvailable}
          />

          <View style={{ marginTop: 'auto', paddingTop: 24 }}>
            <InfoCard
              icon="shield-checkmark"
              iconColor="#EC4899"
              title="Your privacy is our priority"
              desc="All your data is stored only on your device and never shared with anyone."
            />
            <GradientButton label={selected ? 'Enable Lock' : 'Enable Later'} onPress={handlePrimary} hint style={{ width: '100%', marginTop: 20 }} />
            <TouchableOpacity onPress={skipLock} style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ fontFamily: FONT.semiBold, fontSize: 15, color: COLORS.primary }}>Continue without lock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
