import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import OnboardingIcon from '@/components/onboarding/OnboardingIcon';
import InfoCard from '@/components/onboarding/InfoCard';
import GradientButton from '@/components/ui/GradientButton';
import { useSettingsStore } from '@/store/settingsStore';
import { COLORS, FONT } from '@/constants/theme';

const TITLE = '#1E1B4B';
const SUGGESTIONS = ['Priya', 'Ananya', 'My Diary', 'Me'];

export default function NameScreen() {
  const router = useRouter();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [name, setName] = useState('');

  const handleContinue = (value?: string) => {
    updateSettings({ name: value ?? name });
    router.push('/(onboarding)/last-period');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF4FA' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <OnboardingHeader currentStep={1} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>

            <OnboardingIcon icon="person" iconColor="#EC4899" bg="#FCE4F1" heart />

            <Text style={{ fontFamily: FONT.bold, fontSize: 30, color: TITLE, textAlign: 'center', lineHeight: 38 }}>
              What should{'\n'}we call you?
            </Text>
            <Text style={{ fontFamily: FONT.regular, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 28 }}>
              You can always change this later.
            </Text>

            {/* Input */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: name ? COLORS.primary : '#EADDF7', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 16 }}>
              <Ionicons name="person-outline" size={22} color={COLORS.primary} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name or nickname"
                placeholderTextColor="#9CA3AF"
                maxLength={20}
                style={{ flex: 1, fontFamily: FONT.regular, fontSize: 16, color: COLORS.textPrimary }}
              />
            </View>
            <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, textAlign: 'right', marginTop: 8 }}>
              {name.length}/20
            </Text>

            {/* Suggestions */}
            <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: COLORS.textSecondary, marginTop: 16, marginBottom: 12 }}>
              Examples:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {SUGGESTIONS.map((s) => {
                const sel = name === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setName(s)}
                    style={{ paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24, borderWidth: 1.5, borderColor: sel ? COLORS.primary : '#EADDF7', backgroundColor: sel ? '#F3E8FF' : '#FFFFFF' }}
                  >
                    <Text style={{ fontFamily: FONT.medium, fontSize: 15, color: sel ? COLORS.primary : TITLE }}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ marginTop: 'auto', paddingTop: 28 }}>
              <InfoCard
                icon="heart-outline"
                iconColor={COLORS.primary}
                circle={false}
                title="Why we ask?"
                desc="This helps us personalize your experience and motivate you on your journey."
              />

              <GradientButton label="Continue" onPress={() => handleContinue()} disabled={!name.trim()} hint style={{ width: '100%', marginTop: 20 }} />

              <TouchableOpacity onPress={() => handleContinue('')} style={{ alignItems: 'center', paddingVertical: 16 }}>
                <Text style={{ fontFamily: FONT.semiBold, fontSize: 15, color: COLORS.primary }}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
