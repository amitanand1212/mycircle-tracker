import InfoPage, { FAQItem } from '@/components/ui/InfoPage';

const FAQS = [
  {
    question: 'How are my predictions calculated?',
    answer:
      'My Circle uses your last period date along with your average cycle length and period length to estimate your next period, fertile window and ovulation day. The more cycles you log, the more accurate it becomes.',
  },
  {
    question: 'Why do my predictions seem off?',
    answer:
      'Predictions are estimates based on the details you provide. Cycles can vary naturally month to month. Keep your last period date and cycle settings up to date for the best results — it usually takes a few logged cycles to settle in.',
  },
  {
    question: 'How do I change my cycle or period length?',
    answer:
      'Go to Settings → Cycle Settings. Adjust the sliders for your average cycle length and period length, then tap Save Changes. Your predictions update instantly.',
  },
  {
    question: 'How do reminders and notifications work?',
    answer:
      'Open Settings → Reminders to turn on period, ovulation, water and daily-log reminders. Make sure notifications are allowed for My Circle in your device settings. You can also send a test notification from that screen to confirm everything works.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Yes. My Circle is local-only — your cycle data, logs and settings are stored on your device. We do not require an account and your information is not uploaded to any server.',
  },
  {
    question: 'How do I protect the app with a passcode?',
    answer:
      'Go to Settings → Passcode & Security and follow the steps to set up a PIN or biometric lock. Once enabled, the app will ask to unlock each time you reopen it.',
  },
  {
    question: 'How do I delete all my data?',
    answer:
      'Scroll to the bottom of Settings and tap "Delete All Data". This permanently erases your cycle data, logs and settings from your device. This action cannot be undone.',
  },
];

export default function HelpScreen() {
  return (
    <InfoPage title="Help & FAQ" subtitle="Answers to common questions">
      {FAQS.map((f) => (
        <FAQItem key={f.question} question={f.question} answer={f.answer} />
      ))}
    </InfoPage>
  );
}
