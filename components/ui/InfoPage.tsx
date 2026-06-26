import { ReactNode, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';

const TITLE = '#1E1B4B';

export default function InfoPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF1F6' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW }}
        >
          <Ionicons name="chevron-back" size={20} color={TITLE} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 22, color: TITLE }}>{title}</Text>
          {subtitle && <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 1 }}>{subtitle}</Text>}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 14, ...CARD_SHADOW }}>
      <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: TITLE, marginBottom: 8 }}>{title}</Text>
      {children}
    </View>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontFamily: FONT.regular, fontSize: 13.5, lineHeight: 21, color: COLORS.textSecondary, marginBottom: 4 }}>
      {children}
    </Text>
  );
}

export function Bullet({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
      <Text style={{ fontFamily: FONT.bold, fontSize: 13.5, color: COLORS.primary, lineHeight: 21 }}>•</Text>
      <Text style={{ flex: 1, fontFamily: FONT.regular, fontSize: 13.5, lineHeight: 21, color: COLORS.textSecondary }}>{children}</Text>
    </View>
  );
}

export function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 10, overflow: 'hidden', ...CARD_SHADOW }}>
      <TouchableOpacity
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}
      >
        <Text style={{ flex: 1, fontFamily: FONT.semiBold, fontSize: 14, color: TITLE }}>{question}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.primary} />
      </TouchableOpacity>
      {open && (
        <Text style={{ fontFamily: FONT.regular, fontSize: 13.5, lineHeight: 21, color: COLORS.textSecondary, paddingHorizontal: 16, paddingBottom: 16 }}>
          {answer}
        </Text>
      )}
    </View>
  );
}
