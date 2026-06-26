import InfoPage, { Section, Paragraph, Bullet } from '@/components/ui/InfoPage';

export default function PrivacyScreen() {
  return (
    <InfoPage title="Privacy Policy" subtitle="Last updated: June 2026">
      <Section title="Your privacy comes first">
        <Paragraph>
          My Circle is designed to be private by default. Your health is personal, and we built this
          app so your information stays with you.
        </Paragraph>
      </Section>

      <Section title="What we collect">
        <Paragraph>
          We do not require you to create an account, and we do not collect personal information on our
          servers. The data you enter is stored locally on your device, including:
        </Paragraph>
        <Bullet>Your cycle details (last period date, cycle and period length)</Bullet>
        <Bullet>Daily logs such as symptoms, mood and notes</Bullet>
        <Bullet>Your app preferences and reminder settings</Bullet>
      </Section>

      <Section title="How your data is used">
        <Paragraph>
          Your data is used only on your device to calculate predictions, show insights and send the
          reminders you enable. It is not sold, shared or uploaded to any external server by us.
        </Paragraph>
      </Section>

      <Section title="Notifications">
        <Paragraph>
          Reminders are scheduled locally on your device. You can turn them on or off any time from
          Settings → Reminders, or in your device's notification settings.
        </Paragraph>
      </Section>

      <Section title="Your control">
        <Paragraph>
          You are always in control of your data. You can edit it any time, and you can permanently
          erase everything using "Delete All Data" in Settings. Uninstalling the app also removes the
          data stored on your device.
        </Paragraph>
      </Section>

      <Section title="Children">
        <Paragraph>
          My Circle is not intended for use by children under 13. We do not knowingly collect
          information from children.
        </Paragraph>
      </Section>

      <Section title="Changes & contact">
        <Paragraph>
          We may update this policy from time to time. If you have any questions about your privacy,
          please reach out to us through our Google Play Store listing.
        </Paragraph>
      </Section>
    </InfoPage>
  );
}
