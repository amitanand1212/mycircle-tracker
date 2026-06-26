import InfoPage, { Section, Paragraph } from '@/components/ui/InfoPage';

export default function TermsScreen() {
  return (
    <InfoPage title="Terms of Use" subtitle="Last updated: June 2026">
      <Section title="Acceptance of terms">
        <Paragraph>
          By using My Circle, you agree to these Terms of Use. If you do not agree, please discontinue
          use of the app.
        </Paragraph>
      </Section>

      <Section title="Not medical advice">
        <Paragraph>
          My Circle is provided for personal and informational purposes only. It is not a medical
          device and does not provide medical advice, diagnosis or treatment. Predictions such as your
          next period, fertile window and ovulation day are estimates and should not be relied upon for
          contraception, conception or any medical decision. Always consult a qualified healthcare
          professional for medical concerns.
        </Paragraph>
      </Section>

      <Section title="Your responsibilities">
        <Paragraph>
          You are responsible for the accuracy of the information you enter and for keeping your device
          and any passcode secure. The app's predictions depend on the data you provide.
        </Paragraph>
      </Section>

      <Section title="No warranty">
        <Paragraph>
          The app is provided "as is" without warranties of any kind, whether express or implied. We do
          not guarantee that the app will be uninterrupted, error-free or that predictions will be
          accurate.
        </Paragraph>
      </Section>

      <Section title="Limitation of liability">
        <Paragraph>
          To the fullest extent permitted by law, we are not liable for any damages arising from your
          use of, or inability to use, the app.
        </Paragraph>
      </Section>

      <Section title="Changes to these terms">
        <Paragraph>
          We may update these terms from time to time. Continued use of the app after changes means you
          accept the updated terms. For any questions, contact us through our Google Play Store listing.
        </Paragraph>
      </Section>
    </InfoPage>
  );
}
