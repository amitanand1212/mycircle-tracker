import { View, Text, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientButton from '@/components/ui/GradientButton';
import { COLORS, FONT } from '@/constants/theme';

const TITLE = '#1E1B4B';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF4FA' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 12, paddingBottom: 24 }}>

          {/* Illustration with glow */}
          <View style={{ width: '100%', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
            <View style={{ position: 'absolute', top: 24, width: 240, height: 240, borderRadius: 120, backgroundColor: '#F3D9F5', opacity: 0.6 }} />
            <Image
              source={require('@/assets/illustrations/character-1.png')}
              style={{ width: 280, height: 280, resizeMode: 'contain' }}
            />
          </View>

          {/* Logo */}
          <View style={{ marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: 108, height: 108, borderRadius: 54, backgroundColor: '#F3D9F5', opacity: 0.55 }} />
            <Image source={require('@/assets/illustrations/logo-mark.png')} style={{ width: 88, height: 88, resizeMode: 'contain' }} />
          </View>

          {/* Title */}
          <Text style={{ fontFamily: FONT.bold, fontSize: 30, color: TITLE, textAlign: 'center' }}>
            Welcome to
          </Text>
          <Text style={{ fontFamily: FONT.bold, fontSize: 40, textAlign: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#8B5CF6' }}>My </Text>
            <Text style={{ color: '#DB2777' }}>Circle</Text>
          </Text>

          <Text style={{ fontFamily: FONT.regular, fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32, paddingHorizontal: 6 }}>
            Track your cycle, understand your body & take care of yourself better every day.
          </Text>

          {/* Privacy card */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#EFE8FB', borderRadius: 20, padding: 18, width: '100%', marginBottom: 'auto' }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="shield-checkmark-outline" size={26} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: TITLE, marginBottom: 2 }}>
                100% Private & Secure
              </Text>
              <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 }}>
                Your data is encrypted and never shared with anyone.
              </Text>
            </View>
          </View>

          <GradientButton
            label="Get Started"
            onPress={() => router.push('/(onboarding)/name')}
            hint
            style={{ width: '100%', marginTop: 28 }}
          />

          {/* Page dots */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  width: i === 0 ? 22 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === 0 ? COLORS.primary : '#D8C9EC',
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
