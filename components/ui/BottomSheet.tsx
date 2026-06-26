import { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapHeight?: number;
  style?: ViewStyle;
}

export default function BottomSheet({
  visible,
  onClose,
  children,
  snapHeight = SCREEN_HEIGHT * 0.75,
  style,
}: Props) {
  const translateY      = useSharedValue(snapHeight);
  const backdropOpacity = useSharedValue(0);
  // Stay mounted through the close animation so it slides out smoothly.
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value      = withSpring(0, { damping: 20, stiffness: 120 });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value      = withTiming(snapHeight, { duration: 240 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > snapHeight * 0.3) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[backdropStyle, StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              sheetStyle,
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: snapHeight,
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              },
              style,
            ]}
          >
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#F3E8FF' }} />
            </View>
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}
