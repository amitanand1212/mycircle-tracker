import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CARD_SHADOW } from '@/constants/theme';

interface Props {
  currentStep: number;
  totalSteps?: number;
  showBack?: boolean;
}

export default function OnboardingHeader({
  currentStep,
  totalSteps = 6,
  showBack = true,
}: Props) {
  const router = useRouter();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4, gap: 16 }}>
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW }}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 44 }} />
      )}

      <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: totalSteps }).map((_, i) =>
          i < currentStep ? (
            <LinearGradient
              key={i}
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, height: 8, borderRadius: 4 }}
            />
          ) : (
            <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#EADDF7' }} />
          ),
        )}
      </View>

      <View style={{ width: 44 }} />
    </View>
  );
}
