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
          We do not require you to create an account, and we do not collect your health information on
          our servers. The data you enter is stored locally on your device, including:
        </Paragraph>
        <Bullet>Your cycle details (last period date, cycle and period length)</Bullet>
        <Bullet>Daily logs such as symptoms, mood and notes</Bullet>
        <Bullet>Your app preferences and reminder settings</Bullet>
      </Section>

      <Section title="How your data is used">
        <Paragraph>
          Your health data — your cycle details, daily logs and preferences — is used only on your
          device to calculate predictions, show insights and send the reminders you enable. We never
          sell it, and we do not upload it to our own servers.
        </Paragraph>
      </Section>

      <Section title="Advertising">
        <Paragraph>
          My Circle is free and supported by ads served through Google AdMob. To show ads, the AdMob
          service may collect limited information such as your device's advertising identifier, general
          device information and approximate location. This data is handled by Google, not us, and is
          never linked to the health information you log in the app.
        </Paragraph>
        <Paragraph>
          You can learn more in Google's Privacy Policy at policies.google.com/privacy, and you can
          reset or limit your advertising identifier any time in your device's privacy settings.
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
