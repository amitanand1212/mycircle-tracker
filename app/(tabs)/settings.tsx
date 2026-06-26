import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@/components/ui/BottomSheet';
import SliderInput from '@/components/onboarding/SliderInput';
import GradientButton from '@/components/ui/GradientButton';
import { useSettingsStore } from '@/store/settingsStore';
import { useLogStore } from '@/store/logStore';
import { useCycleStore } from '@/store/cycleStore';
import { useSymptomsStore } from '@/store/symptomsStore';
import { SYMPTOM_ICON_CHOICES } from '@/constants/symptoms';
import { requestNotificationPermission, syncReminders, sendTestNotification } from '@/utils/notifications';
import { PLAY_STORE_URL, openPlayStore, setReviewStatus } from '@/utils/appReview';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';

const TITLE = '#1E1B4B';
const PINK_BG = '#FCE4F1';
const PURPLE_BG = '#EFE6FB';
const PINK = '#EC4899';
const PURPLE = '#7C5CFC';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type SheetType = 'profile' | 'cycle' | 'reminders' | 'symptoms' | null;

function Row({
  icon, iconBg, iconColor, title, subtitle, onPress, last,
}: {
  icon: IconName; iconBg: string; iconColor: string; title: string; subtitle?: string; onPress: () => void; last?: boolean;
}) {
  return (
    <View>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={21} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: TITLE }}>{title}</Text>
          {subtitle && <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 1 }}>{subtitle}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#B6AECB" />
      </TouchableOpacity>
      {!last && <View style={{ height: 1, backgroundColor: '#F3ECF7', marginLeft: 58 }} />}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const recompute = useCycleStore((s) => s.recompute);
  const clear = useCycleStore((s) => s.clear);

  const symptoms = useSymptomsStore((s) => s.symptoms);
  const toggleSymptom = useSymptomsStore((s) => s.toggleEnabled);
  const addCustomSymptom = useSymptomsStore((s) => s.addCustom);
  const removeCustomSymptom = useSymptomsStore((s) => s.removeCustom);
  const resetSymptoms = useSymptomsStore((s) => s.resetSymptoms);

  const [sheet, setSheet] = useState<SheetType>(null);

  // editable drafts
  const [nameDraft, setNameDraft] = useState(settings.name);
  const [cycleDraft, setCycleDraft] = useState(settings.cycleLength);
  const [periodDraft, setPeriodDraft] = useState(settings.periodLength);
  const [periodRem, setPeriodRem] = useState(settings.periodReminders);
  const [ovRem, setOvRem] = useState(settings.ovulationReminders);
  const [waterRem, setWaterRem] = useState(settings.waterReminders);
  const [logRem, setLogRem] = useState(settings.logReminders);
  const [symptomName, setSymptomName] = useState('');
  const [symptomIcon, setSymptomIcon] = useState<string>(SYMPTOM_ICON_CHOICES[0]);

  const customCount = symptoms.filter((s) => !s.builtIn).length;
  const MAX_CUSTOM = 12;

  const openSymptoms = () => { setSymptomName(''); setSymptomIcon(SYMPTOM_ICON_CHOICES[0]); setSheet('symptoms'); };

  const addSymptom = () => {
    const name = symptomName.trim();
    if (!name) return;
    if (customCount >= MAX_CUSTOM) {
      Alert.alert('Limit reached', `You can add up to ${MAX_CUSTOM} custom symptoms.`);
      return;
    }
    addCustomSymptom(name, symptomIcon);
    setSymptomName('');
    setSymptomIcon(SYMPTOM_ICON_CHOICES[0]);
  };

  const confirmRemoveSymptom = (key: string, label: string) =>
    Alert.alert('Remove symptom', `Remove "${label}" from your list? Existing logs keep their data.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCustomSymptom(key) },
    ]);

  const memberSince = settings.createdAt ? format(parseISO(settings.createdAt), 'MMM yyyy') : '';
  const profileSubtitle = settings.name
    ? (memberSince ? `Tracking since ${memberSince}` : 'Your personal cycle profile')
    : 'Add your details';

  const openProfile = () => { setNameDraft(settings.name); setSheet('profile'); };
  const openCycle = () => { setCycleDraft(settings.cycleLength); setPeriodDraft(settings.periodLength); setSheet('cycle'); };
  const openReminders = () => { setPeriodRem(settings.periodReminders); setOvRem(settings.ovulationReminders); setWaterRem(settings.waterReminders); setLogRem(settings.logReminders); setSheet('reminders'); };

  const saveProfile = () => {
    updateSettings({ name: nameDraft.trim() });
    setSheet(null);
  };

  const saveCycle = () => {
    updateSettings({ cycleLength: cycleDraft, periodLength: periodDraft });
    recompute(settings.lastPeriodDate, cycleDraft, periodDraft);
    setSheet(null);
  };

  const saveReminders = async () => {
    updateSettings({ periodReminders: periodRem, ovulationReminders: ovRem, waterReminders: waterRem, logReminders: logRem });
    const cd = useCycleStore.getState().cycleData;

    // If anything is enabled, make sure we have permission first.
    let granted = true;
    if (periodRem || ovRem || waterRem || logRem) {
      granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications disabled',
          'Reminders are saved, but notifications are turned off for My Circle. Enable them in your device settings to receive reminders.',
        );
      }
    }

    // Always sync — this also cancels reminders when everything is turned off.
    await syncReminders({
      periodReminders: granted && periodRem,
      ovulationReminders: granted && ovRem,
      waterReminders: granted && waterRem,
      logReminders: granted && logRem,
      nextPeriodDate: cd?.nextPeriodDate,
      ovulationDate: cd?.ovulationDate,
      fertileStartDate: cd?.fertileWindowStart,
    });
    setSheet(null);
  };

  const handleTestNotification = async () => {
    const ok = await sendTestNotification();
    Alert.alert(
      ok ? 'Test sent 🔔' : 'Notifications disabled',
      ok
        ? "You should see a notification in a couple of seconds. If it doesn't appear, check your device notification settings."
        : 'Please allow notifications for My Circle in your device settings, then try again.',
    );
  };

  const comingSoon = (feature: string) =>
    Alert.alert(feature, 'This feature is coming soon. Stay tuned! 🌸');

  const shareApp = async () => {
    try {
      await Share.share({
        message: `Track your cycle privately with My Circle 🌸 — a simple, secure period & cycle tracker. Download it here: ${PLAY_STORE_URL}`,
      });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  const showPremiumSoon = () =>
    Alert.alert(
      'Premium ✨ Coming Soon',
      "Premium isn't available just yet! We're carefully crafting advanced insights, trend analysis, cloud backup and personalized health tips just for you. 💜\n\nYou'll be the first to know when it launches. 🌸",
    );

  const handlePasscode = () => {
    if (settings.appLockEnabled) {
      Alert.alert('App Lock', `${settings.appLockType === 'pin' ? 'PIN' : 'Biometric'} lock is enabled.`, [
        { text: 'Keep Enabled', style: 'cancel' },
        { text: 'Disable Lock', style: 'destructive', onPress: () => updateSettings({ appLockEnabled: false, appLockType: null, pin: null }) },
      ]);
    } else {
      router.push('/(onboarding)/app-lock');
    }
  };

  const handleDeleteAll = () =>
    Alert.alert('Delete All Data', 'This will permanently erase all your cycle data, logs, and settings. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Everything',
        style: 'destructive',
        onPress: () => {
          useLogStore.getState().entries.forEach((e) => useLogStore.getState().deleteEntry(e.id));
          clear();
          resetSettings();
          resetSymptoms();
          router.replace('/(onboarding)/welcome');
        },
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF1F6' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW }}>
          <Ionicons name="chevron-back" size={20} color={TITLE} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 24, color: TITLE }}>Settings</Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>Manage your preferences</Text>
        </View>
        <TouchableOpacity onPress={showPremiumSoon} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 12, height: 40, ...CARD_SHADOW }}>
          <Text style={{ fontSize: 14 }}>👑</Text>
          <Text style={{ fontFamily: FONT.semiBold, fontSize: 13, color: PINK }}>Premium</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 }}>
        {/* Profile card */}
        <TouchableOpacity activeOpacity={0.85} onPress={openProfile} style={{ backgroundColor: '#EFE7F6', borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <View>
            <LinearGradient colors={['#C084FC', '#F0ABFC']} style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' }}>
              <Ionicons name="person" size={38} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW }}>
              <Ionicons name="camera" size={14} color={COLORS.primary} />
            </View>
          </View>
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 19, color: TITLE }}>Hello, {settings.name || 'there'} 🌸</Text>
            <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, marginTop: 2, marginBottom: 8 }}>{profileSubtitle}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start' }}>
              <Ionicons name="pencil" size={12} color={COLORS.primary} />
              <Text style={{ fontFamily: FONT.semiBold, fontSize: 12, color: COLORS.primary }}>Edit Profile</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B6AECB" />
        </TouchableOpacity>

        {/* Preferences */}
        <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: TITLE, marginBottom: 12 }}>Preferences</Text>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 22, paddingHorizontal: 16, marginBottom: 24, ...CARD_SHADOW }}>
          <Row icon="calendar" iconBg={PINK_BG} iconColor={PINK} title="Cycle Settings" subtitle="Cycle length, period length & more" onPress={openCycle} />
          <Row icon="notifications" iconBg={PURPLE_BG} iconColor={PURPLE} title="Reminders" subtitle="Manage your reminders and alerts" onPress={openReminders} />
          <Row icon="water" iconBg={PINK_BG} iconColor={PINK} title="Flow & Symptoms" subtitle="Customize your symptoms list" onPress={openSymptoms} />
          <Row icon="color-palette" iconBg={PURPLE_BG} iconColor={PURPLE} title="Appearance" subtitle="Choose theme, colors & font" onPress={() => comingSoon('Appearance')} />
          <Row icon="lock-closed" iconBg={PINK_BG} iconColor={PINK} title="Passcode & Security" subtitle={settings.appLockEnabled ? 'Lock enabled — tap to manage' : 'Protect your data with passcode'} onPress={handlePasscode} />
          <Row icon="cloud-upload" iconBg={PURPLE_BG} iconColor={PURPLE} title="Backup & Restore" subtitle="Backup your data to cloud" onPress={() => comingSoon('Backup & Restore')} last />
        </View>

        {/* Support & More */}
        <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: TITLE, marginBottom: 12 }}>Support & More</Text>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 22, paddingHorizontal: 16, marginBottom: 24, ...CARD_SHADOW }}>
          <Row icon="share-social" iconBg={PINK_BG} iconColor={PINK} title="Share My Circle" subtitle="Invite friends to track with you" onPress={shareApp} />
          <Row icon="star" iconBg={PURPLE_BG} iconColor={PURPLE} title="Rate us on Play Store" subtitle="Love the app? Leave a review ⭐" onPress={() => { setReviewStatus('rated'); openPlayStore(); }} />
          <Row icon="help-circle" iconBg={PINK_BG} iconColor={PINK} title="Help & FAQ" subtitle="Get help and find answers" onPress={() => router.push('/help')} />
          <Row icon="shield-checkmark" iconBg={PURPLE_BG} iconColor={PURPLE} title="Privacy Policy" subtitle="Learn how we protect your data" onPress={() => router.push('/privacy')} />
          <Row icon="document-text" iconBg={PINK_BG} iconColor={PINK} title="Terms of Use" subtitle="Read our terms and conditions" onPress={() => router.push('/terms')} />
          <Row icon="information-circle" iconBg={PURPLE_BG} iconColor={PURPLE} title="About My Circle" subtitle="App version 1.0.0" onPress={() => Alert.alert('My Circle', 'Version 1.0.0\nA private, local-only period tracker. 🌸')} last />
        </View>

        {/* Go Premium */}
        <LinearGradient colors={['#EFE6FB', '#F8EAF4']} style={{ borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', marginBottom: 20 }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: TITLE, marginBottom: 6 }}>Go Premium 👑</Text>
            <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 12 }}>
              Unlock advanced insights, remove ads and more premium features.
            </Text>
            <TouchableOpacity onPress={showPremiumSoon}>
              <LinearGradient colors={['#8B5CF6', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9, alignSelf: 'flex-start' }}>
                <Text style={{ fontFamily: FONT.semiBold, fontSize: 13, color: '#FFFFFF' }}>Upgrade Now</Text>
                <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 64 }}>👑</Text>
        </LinearGradient>

        {/* Delete all data */}
        <TouchableOpacity onPress={handleDeleteAll} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 }}>
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text style={{ fontFamily: FONT.semiBold, fontSize: 14, color: COLORS.error }}>Delete All Data</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Edit Profile sheet ── */}
      <BottomSheet visible={sheet === 'profile'} onClose={() => setSheet(null)} snapHeight={360}>
        <View style={{ padding: 20 }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: TITLE, marginBottom: 16 }}>Edit Profile</Text>
          <Text style={{ fontFamily: FONT.medium, fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 }}>Your name</Text>
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Enter your name"
            placeholderTextColor="#9CA3AF"
            maxLength={20}
            style={{ fontFamily: FONT.regular, fontSize: 16, color: COLORS.textPrimary, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EADDF7', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 24 }}
          />
          <GradientButton label="Save" onPress={saveProfile} arrow={false} style={{ width: '100%' }} />
        </View>
      </BottomSheet>

      {/* ── Cycle Settings sheet ── */}
      <BottomSheet visible={sheet === 'cycle'} onClose={() => setSheet(null)} snapHeight={560}>
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: TITLE, marginBottom: 20 }}>Cycle Settings</Text>
          <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: COLORS.textSecondary, marginBottom: 8, textAlign: 'center' }}>Average cycle length</Text>
          <SliderInput value={cycleDraft} minimumValue={21} maximumValue={45} onValueChange={setCycleDraft} />
          <View style={{ height: 24 }} />
          <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: COLORS.textSecondary, marginBottom: 8, textAlign: 'center' }}>Period length</Text>
          <SliderInput value={periodDraft} minimumValue={2} maximumValue={10} onValueChange={setPeriodDraft} />
          <GradientButton label="Save Changes" onPress={saveCycle} arrow={false} style={{ width: '100%', marginTop: 28 }} />
        </ScrollView>
      </BottomSheet>

      {/* ── Reminders sheet ── */}
      <BottomSheet visible={sheet === 'reminders'} onClose={() => setSheet(null)} snapHeight={640}>
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: TITLE, marginBottom: 20 }}>Reminders</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, gap: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F1ECF7' }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: PINK_BG, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="water" size={22} color={PINK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: TITLE }}>Period reminders</Text>
              <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>2 days before &amp; on the day it starts.</Text>
            </View>
            <Switch value={periodRem} onValueChange={setPeriodRem} trackColor={{ false: '#E5E0EF', true: COLORS.primary }} thumbColor="#FFFFFF" ios_backgroundColor="#E5E0EF" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, gap: 14, marginBottom: 24, borderWidth: 1, borderColor: '#F1ECF7' }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: PINK_BG, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="flower" size={22} color={PINK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: TITLE }}>Ovulation reminders</Text>
              <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>Fertile window start &amp; ovulation day.</Text>
            </View>
            <Switch value={ovRem} onValueChange={setOvRem} trackColor={{ false: '#E5E0EF', true: COLORS.primary }} thumbColor="#FFFFFF" ios_backgroundColor="#E5E0EF" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, gap: 14, marginBottom: 24, borderWidth: 1, borderColor: '#F1ECF7' }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#E6F0FB', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="water" size={22} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: TITLE }}>Water reminders</Text>
              <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>Twice daily — 11:00 AM &amp; 5:00 PM.</Text>
            </View>
            <Switch value={waterRem} onValueChange={setWaterRem} trackColor={{ false: '#E5E0EF', true: COLORS.primary }} thumbColor="#FFFFFF" ios_backgroundColor="#E5E0EF" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, gap: 14, marginBottom: 24, borderWidth: 1, borderColor: '#F1ECF7' }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: PURPLE_BG, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="create" size={22} color={PURPLE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: TITLE }}>Daily log reminder</Text>
              <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>Log symptoms &amp; mood — 8:00 PM daily.</Text>
            </View>
            <Switch value={logRem} onValueChange={setLogRem} trackColor={{ false: '#E5E0EF', true: COLORS.primary }} thumbColor="#FFFFFF" ios_backgroundColor="#E5E0EF" />
          </View>

          <GradientButton label="Save" onPress={saveReminders} arrow={false} style={{ width: '100%' }} />
          <TouchableOpacity onPress={handleTestNotification} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, marginTop: 4 }}>
            <Ionicons name="notifications-outline" size={16} color={COLORS.primary} />
            <Text style={{ fontFamily: FONT.semiBold, fontSize: 14, color: COLORS.primary }}>Send a test notification</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>

      {/* ── Flow & Symptoms sheet ── */}
      <BottomSheet visible={sheet === 'symptoms'} onClose={() => setSheet(null)} snapHeight={680}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: TITLE }}>Flow &amp; Symptoms</Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 18 }}>
            Turn symptoms on or off, or add your own. They show up when you log your day.
          </Text>

          {/* Symptom list */}
          <View style={{ gap: 10, marginBottom: 24 }}>
            {symptoms.map((s) => (
              <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, gap: 12, borderWidth: 1, borderColor: '#F1ECF7' }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: `${s.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={s.icon as IconName} size={20} color={s.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.semiBold, fontSize: 14, color: TITLE }}>{s.label}</Text>
                  <Text style={{ fontFamily: FONT.regular, fontSize: 11, color: COLORS.textSecondary }}>
                    {s.builtIn ? 'Built-in' : 'Custom'}{s.enabled ? '' : ' · Hidden'}
                  </Text>
                </View>
                {!s.builtIn && (
                  <TouchableOpacity onPress={() => confirmRemoveSymptom(s.key, s.label)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                )}
                <Switch value={s.enabled} onValueChange={() => toggleSymptom(s.key)} trackColor={{ false: '#E5E0EF', true: COLORS.primary }} thumbColor="#FFFFFF" ios_backgroundColor="#E5E0EF" />
              </View>
            ))}
          </View>

          {/* Add custom symptom */}
          <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: TITLE, marginBottom: 4 }}>Add your own</Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 }}>
            {customCount}/{MAX_CUSTOM} custom symptoms used
          </Text>
          <TextInput
            value={symptomName}
            onChangeText={setSymptomName}
            placeholder="e.g. Dizziness, Cravings…"
            placeholderTextColor="#9CA3AF"
            maxLength={24}
            style={{ fontFamily: FONT.regular, fontSize: 15, color: COLORS.textPrimary, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EADDF7', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, marginBottom: 14 }}
          />
          <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: COLORS.textSecondary, marginBottom: 10 }}>Pick an icon</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            {SYMPTOM_ICON_CHOICES.map((ic) => {
              const sel = ic === symptomIcon;
              return (
                <TouchableOpacity
                  key={ic}
                  activeOpacity={0.8}
                  onPress={() => setSymptomIcon(ic)}
                  style={{ width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: sel ? COLORS.primary : COLORS.border, backgroundColor: sel ? '#FAF5FF' : '#FFFFFF' }}
                >
                  <Ionicons name={ic as IconName} size={22} color={sel ? COLORS.primary : COLORS.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>
          <GradientButton label="Add Symptom" onPress={addSymptom} arrow={false} style={{ width: '100%' }} />
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
