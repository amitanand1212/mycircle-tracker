import { useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
}

export default function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color = COLORS.primary,
  trackColor = COLORS.border,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(progress, { damping: 15, stiffness: 80 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (animatedProgress.value / 100) * circumference,
  }));

  return (
    <Svg
      width={size}
      height={size}
      style={{ transform: [{ rotate: '-90deg' }] }}
    >
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}
