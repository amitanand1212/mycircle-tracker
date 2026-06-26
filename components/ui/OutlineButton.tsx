import { TouchableOpacity, Text, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, FONT } from '@/constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Props {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  color?: string;
}

export default function OutlineButton({ label, onPress, style, color = COLORS.primary }: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedTouchable
      onPress={onPress}
      activeOpacity={0.85}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 320 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 260 }); }}
      style={[
        {
          height: 56,
          borderRadius: 28,
          borderWidth: 1.5,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
        animStyle,
      ]}
    >
      <Text style={{ fontFamily: FONT.semiBold, fontSize: 16, color }}>
        {label}
      </Text>
    </AnimatedTouchable>
  );
}
