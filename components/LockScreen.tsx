import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Pressable, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/store/settingsStore';
import { COLORS, FONT } from '@/constants/theme';

interface Props {
  onUnlock: () => void;
}

const NUMPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

function LockBadge() {
  return (
    <View style={{ marginBottom: 28 }}>
      <View
        style={{
          position: 'absolute',
          top: -8,
          left: -8,
          right: -8,
          bottom: -8,
          borderRadius: 60,
          backgroundColor: COLORS.primary,
          opacity: 0.12,
        }}
      />
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        <Ionicons name="lock-closed" size={34} color="#fff" />
      </LinearGradient>
    </View>
  );
}

export default function LockScreen({ onUnlock }: Props) {
  const settings = useSettingsStore((s) => s.settings);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [bioStatus, setBioStatus] = useState('Unlock with your fingerprint or face');
  const [authing, setAuthing] = useState(false);

  const shake = useRef(new Animated.Value(0)).current;
  // Guards against overlapping prompts. A ref (not state) so the check is
  // synchronous and immune to React's async state batching.
  const promptInFlight = useRef(false);
  const isBiometric = settings.appLockType === 'biometric';
  const insets = useSafeAreaInsets();
  const greetingName = settings.name?.trim();

  // Trigger the biometric prompt only while the app is actually in the
  // foreground. The lock screen gets mounted *as the app is backgrounding*
  // (RootLayout flips it locked on the background/inactive event), so a plain
  // on-mount prompt fires before the activity is resumed and the OS silently
  // drops it — that's why re-unlock failed after a background/lock. We instead
  // authenticate when the app is/returns to 'active'.
  const authRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!isBiometric) return;
    if (AppState.currentState === 'active') authRef.current();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') authRef.current();
    });
    return () => sub.remove();
  }, [isBiometric]);

  const authenticate = async () => {
    if (promptInFlight.current) return;
    promptInFlight.current = true;
    setAuthing(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware) {
        setBioStatus('Biometric hardware not available on this device');
        return;
      }
      if (!enrolled) {
        setBioStatus('No fingerprint/face enrolled in device settings');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock My Circle',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      const errCode = result.success ? undefined : (result.error as string | undefined);
      if (result.success) {
        onUnlock();
      } else if (errCode === 'lockout' || errCode === 'lockout_permanent') {
        setBioStatus('Too many attempts. Try again later.');
      } else if (errCode === 'user_cancel' || errCode === 'system_cancel' || errCode === 'app_cancel') {
        setBioStatus('Tap to unlock');
      } else {
        setBioStatus('Could not verify. Tap to try again.');
      }
    } catch (e) {
      setBioStatus('Authentication error. Tap to try again.');
    } finally {
      promptInFlight.current = false;
      setAuthing(false);
    }
  };

  // Keep the AppState effect pointing at the latest closure.
  authRef.current = authenticate;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleNumpad = (val: string) => {
    if (val === '') return;
    if (val === 'del') {
      setPin((p) => p.slice(0, -1));
      setError(false);
      return;
    }
    if (pin.length >= 4) return;

    const next = pin + val;
    setPin(next);
    if (next.length === 4) {
      if (next === settings.pin) {
        onUnlock();
      } else {
        setError(true);
        triggerShake();
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 700);
      }
    }
  };

  /* ── Biometric-only unlock ── */
  if (isBiometric) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <LockBadge />
        <Text style={{ fontFamily: FONT.bold, fontSize: 26, color: COLORS.textPrimary }}>
          {greetingName ? `Hi ${greetingName}` : 'Welcome back'}
        </Text>
        <Text
          style={{
            fontFamily: FONT.regular,
            fontSize: 15,
            color: COLORS.textSecondary,
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          {bioStatus}
        </Text>

        <Pressable
          onPress={authenticate}
          disabled={authing}
          style={({ pressed }) => ({
            marginTop: 44,
            width: 96,
            height: 96,
            borderRadius: 48,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? COLORS.border : COLORS.surface,
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 5,
          })}
        >
          <Ionicons name="finger-print" size={44} color={COLORS.primary} />
        </Pressable>
        <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: COLORS.primary, marginTop: 16 }}>
          Tap to unlock
        </Text>
      </View>
    );
  }

  /* ── PIN unlock ── */
  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-12, 12] });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingTop: insets.top + 48,
        paddingBottom: insets.bottom + 56,
      }}
    >
      {/* Header */}
      <View style={{ alignItems: 'center' }}>
        <LockBadge />

        <Text style={{ fontFamily: FONT.bold, fontSize: 26, color: COLORS.textPrimary }}>
          {greetingName ? `Hi ${greetingName}` : 'Welcome back'}
        </Text>
        <Text
          style={{
            fontFamily: FONT.regular,
            fontSize: 15,
            color: error ? COLORS.error : COLORS.textSecondary,
            marginTop: 8,
          }}
        >
          {error ? 'Incorrect PIN, try again' : 'Enter your PIN to continue'}
        </Text>

        {/* PIN dots */}
        <Animated.View
          style={{
            flexDirection: 'row',
            gap: 18,
            marginTop: 36,
            transform: [{ translateX: shakeX }],
          }}
        >
          {[0, 1, 2, 3].map((i) => {
            const filled = pin.length > i;
            return (
              <View
                key={i}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  borderWidth: filled ? 0 : 1.5,
                  borderColor: COLORS.border,
                  backgroundColor: filled
                    ? error
                      ? COLORS.error
                      : COLORS.primary
                    : 'transparent',
                }}
              />
            );
          })}
        </Animated.View>
      </View>

      {/* Numpad */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 280, justifyContent: 'center', gap: 16 }}>
        {NUMPAD.map((key, idx) => {
          const isBlank = key === '';
          return (
            <Pressable
              key={idx}
              onPress={() => handleNumpad(key)}
              disabled={isBlank}
              style={({ pressed }) => ({
                width: 72,
                height: 72,
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isBlank
                  ? 'transparent'
                  : key === 'del'
                    ? 'transparent'
                    : pressed
                      ? COLORS.border
                      : COLORS.surface,
                opacity: pressed ? 0.9 : 1,
                ...(isBlank || key === 'del'
                  ? {}
                  : {
                      shadowColor: COLORS.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 12,
                      elevation: 3,
                    }),
              })}
            >
              {key === 'del' ? (
                <Ionicons name="backspace-outline" size={26} color={COLORS.textSecondary} />
              ) : (
                <Text style={{ fontFamily: FONT.medium, fontSize: 26, color: COLORS.textPrimary }}>
                  {key}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
