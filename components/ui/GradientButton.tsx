import { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const HINT_DELAY = 2000;

interface Props {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  icon?: React.ReactNode;
  arrow?: boolean;
  /** Pulse the button after ~2s of no interaction to invite a tap. */
  hint?: boolean;
}

export default function GradientButton({ label, onPress, style, disabled, icon, arrow = true, hint = false }: Props) {
  const scale = useSharedValue(1);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const clearTimer = () => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  };

  // Start the idle countdown; when it elapses, pulse to hint the user.
  const scheduleHint = () => {
    clearTimer();
    if (!hint || disabled) return;
    idleTimer.current = setTimeout(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 650 }),
          withTiming(1, { duration: 650 }),
        ),
        -1,
        false,
      );
    }, HINT_DELAY);
  };

  useEffect(() => {
    cancelAnimation(scale);
    scale.value = withTiming(1, { duration: 150 });
    scheduleHint();
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hint, disabled]);

  return (
    <AnimatedTouchable
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.9}
      onPressIn={() => {
        clearTimer();
        cancelAnimation(scale);
        scale.value = withSpring(0.95, { damping: 15, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 260 });
        scheduleHint();
      }}
      style={[style, animStyle]}
    >
      <LinearGradient
        colors={['#8B5CF6', '#C026D3', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 60,
          borderRadius: 30,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          opacity: disabled ? 0.5 : 1,
          ...CARD_SHADOW,
          shadowColor: COLORS.primary,
        }}
      >
        {icon}
        <Text style={{ fontFamily: FONT.semiBold, fontSize: 17, color: '#FFFFFF' }}>{label}</Text>
        {arrow && <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />}
      </LinearGradient>
    </AnimatedTouchable>
  );
}
