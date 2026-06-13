import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { FEEDBACK_EMAIL, HELP_DESK_EMAIL } from '../constants/contact';
import { RootStackParamList } from '../types/navigation';

const LAST_UPDATED = 'May 13, 2026';

const TERMS_WEB_URL = 'https://godkingdomprinciplesradio.com/terms';

function getPrivacyPolicyUrl(): string {
  const fromConfig = (Constants.expoConfig?.extra as { privacyPolicyUrl?: string } | undefined)
    ?.privacyPolicyUrl;
  return fromConfig?.trim() || 'https://godkingdomprinciplesradio.com/privacy';
}

function openUrlDeferred(url: string) {
  setTimeout(() => {
    void Linking.openURL(url).catch((err) => console.warn('openURL failed:', err));
  }, 0);
}

type TermsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function TermsOfServiceScreen() {
  const navigation = useNavigation<TermsNavigationProp>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const linkStyle = useMemo(
    () => ({
      color: theme.colors.primary,
      fontWeight: '700' as const,
      textDecorationLine: 'underline' as const,
    }),
    [theme.colors.primary]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
          </Pressable>
        )}
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <Text style={styles.headerSubtitle}>& Community Guidelines</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

        {/* Intro */}
        <Section title="Welcome to GKP Radio" theme={theme}>
          <Body theme={theme}>
            These Terms of Service ("Terms") govern your use of the GKP Radio mobile application
            ("App") operated by God Kingdom Principles Radio ("GKP Radio", "we", "us", or "our").
            By creating an account or using the App, you agree to be bound by these Terms. If you
            do not agree to these Terms, do not use the App.
          </Body>
        </Section>

        {/* EULA / Acceptance */}
        <Section title="1. Acceptance of Terms" theme={theme}>
          <Body theme={theme}>
            By registering for or logging in to GKP Radio, you confirm that you are at least 18
            years old (or the minimum age required by law in your jurisdiction if that age is
            higher), that you have read and understood these Terms, and that you agree to comply
            with them.
          </Body>
          <Body theme={theme}>
            Community features (posts, comments, and live chat) are intended for adults. If you
            do not meet the age requirement, do not create an account or use those features.
          </Body>
        </Section>

        {/* Zero-Tolerance UGC Policy */}
        <Section title="2. Community Content — Zero-Tolerance Policy" theme={theme}>
          <AlertBanner
            theme={theme}
            message="GKP Radio has a strict ZERO TOLERANCE policy for objectionable content and abusive behaviour. Violations will result in immediate content removal and permanent account termination."
          />

          <Body theme={theme}>
            The GKP Radio Community is a Christ-centred, faith-based space intended for uplifting
            discussion, prayer, testimonies, and encouragement. All content you post — including
            text, images, prayer requests, and comments — must align with these values.
          </Body>

          <Body theme={theme}>
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>
              The following content is strictly prohibited:{'\n'}
            </Text>
            {'• '} Hate speech, discrimination, or content targeting individuals based on race,
            ethnicity, gender, religion, sexual orientation, disability, or national origin.{'\n'}
            {'• '} Sexual, explicit, pornographic, or suggestive content.{'\n'}
            {'• '} Threats of violence, harassment, intimidation, or bullying.{'\n'}
            {'• '} Spam, fraudulent solicitation, or requests for money or donations from other
            members.{'\n'}
            {'• '} Content that promotes self-harm, suicide, or substance abuse.{'\n'}
            {'• '} Misinformation or content designed to deceive.{'\n'}
            {'• '} Any content that violates applicable local, national, or international law.
          </Body>
          <Body theme={theme}>
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>Anonymous posts: </Text>
            You may choose to hide your display name from other members. Your account and content
            remain associated in our systems for safety, moderation, and law-enforcement requests
            where applicable. Anonymous posting does not exempt you from these Terms.
          </Body>
        </Section>

        {/* Content Moderation */}
        <Section title="3. Content Moderation & Enforcement" theme={theme}>
          <Body theme={theme}>
            We use automated safeguards on submissions — including stripping HTML/markup,
            enforced length limits, fixed community categories, profanity and harassment pattern
            checks at publish time — together with human moderation and member reporting.
          </Body>
          <Body theme={theme}>
            GKP Radio actively monitors community content. We are committed to reviewing and
            acting on all reported content <Text style={{ fontWeight: '700', color: theme.colors.text }}>within 24 hours</Text>.
            Enforcement actions include:
          </Body>
          <Body theme={theme}>
            {'• '} Immediate removal of objectionable or violating content.{'\n'}
            {'• '} Suspension or permanent termination of accounts responsible for violations.{'\n'}
            {'• '} Escalation to law enforcement where applicable (e.g., threats, illegal content).
          </Body>
          <Body theme={theme}>
            We reserve the right to remove any content and terminate any account at our sole
            discretion, without prior notice, if we determine that a violation of these Terms has
            occurred.
          </Body>
        </Section>

        {/* Reporting */}
        <Section title="4. Reporting Objectionable Content" theme={theme}>
          <Body theme={theme}>
            If you encounter content that violates these Terms, you can report it directly within
            the app:
          </Body>
          <Body theme={theme}>
            {'• '} Tap the <Text style={{ fontWeight: '700', color: theme.colors.text }}>⋯ (more options)</Text> button
            on any post.{'\n'}
            {'• '} Select <Text style={{ fontWeight: '700', color: theme.colors.text }}>Report post</Text> from the menu.{'\n'}
            {'• '} On comments, use the same menu on the comment row and choose{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>Report comment</Text>.{'\n'}
            {'• On another member\u2019s profile, tap '}
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>⋯</Text>
            {' and choose '}
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>Report user</Text>.{'\n'}
            {'• '} In <Text style={{ fontWeight: '700', color: theme.colors.text }}>Live chat</Text> (radio player), tap{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>⋯</Text> on a message for{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>Report chat message</Text> or{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>Block</Text>.{'\n'}
            {'• '} Choose the reason for your report and submit.
          </Body>
          <Body theme={theme}>
            Our moderation team will review all reports and respond within 24 hours.
          </Body>
        </Section>

        {/* Blocking */}
        <Section title="5. Blocking Abusive Users" theme={theme}>
          <Body theme={theme}>
            You may block any community member whose behaviour you find abusive or uncomfortable:
          </Body>
          <Body theme={theme}>
            {'• '} Tap the <Text style={{ fontWeight: '700', color: theme.colors.text }}>⋯ (more options)</Text> button
            on a post by that user, then <Text style={{ fontWeight: '700', color: theme.colors.text }}>Block</Text>.{'\n'}
            {'• '} Or open their profile, tap <Text style={{ fontWeight: '700', color: theme.colors.text }}>⋯</Text>, and choose{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>Block</Text>.{'\n'}
            {'• '} In <Text style={{ fontWeight: '700', color: theme.colors.text }}>Live chat</Text>, tap <Text style={{ fontWeight: '700', color: theme.colors.text }}>⋯</Text> on their message and choose{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>Block</Text>.{'\n'}
            {'• '} Confirm the block. You will no longer see posts, comments, or live chat messages from that member.
          </Body>
        </Section>

        {/* Media Content */}
        <Section title="6. Media Content & Intellectual Property" theme={theme}>
          <Body theme={theme}>
            All podcasts, videos, sermons, and live broadcasts available through GKP Radio are
            original content owned by God Kingdom Principles Radio. Unauthorised reproduction,
            distribution, or public performance of this content is strictly prohibited.
          </Body>
          <Body theme={theme}>
            By submitting content to the Community, you grant GKP Radio a non-exclusive,
            royalty-free licence to display and moderate that content within the App.
          </Body>
        </Section>

        {/* Privacy */}
        <Section title="7. Privacy" theme={theme}>
          <Body theme={theme}>
            Your use of the App is also governed by our{' '}
            <Text style={linkStyle} onPress={() => navigation.navigate('PrivacyPolicy' as any)}>
              Privacy Policy
            </Text>
            . By using GKP Radio, you consent to the collection and use of
            information as described therein. We do not sell your personal data to third parties.
          </Body>
        </Section>

        {/* Disclaimers */}
        <Section title="8. Disclaimer & Limitation of Liability" theme={theme}>
          <Body theme={theme}>
            GKP Radio is provided on an "as is" and "as available" basis without warranties of
            any kind. To the fullest extent permitted by law, GKP Radio shall not be liable for
            any indirect, incidental, or consequential damages arising from your use of the App
            or its community features.
          </Body>
        </Section>

        {/* Changes */}
        <Section title="9. Changes to These Terms" theme={theme}>
          <Body theme={theme}>
            We may update these Terms from time to time. Significant changes will be communicated
            through the App. Your continued use of the App after changes are posted constitutes
            your acceptance of the updated Terms.
          </Body>
        </Section>

        {/* Contact */}
        <Section title="10. Contact Us" theme={theme}>
          <Body theme={theme}>
            If you have questions about these Terms, need help with your account, or wish to
            report inappropriate activity (including content that may violate law or these Terms),
            you can reach us in any of these ways:
          </Body>
          <Body theme={theme}>
            {'• '} In the App: open <Text style={{ fontWeight: '700', color: theme.colors.text }}>Profile → Help & Support</Text> (opens your email app).{'\n'}
            {'• '} Email (general / safety):{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>{HELP_DESK_EMAIL}</Text>
            {'\n'}
            {'• '} Email (feedback):{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>{FEEDBACK_EMAIL}</Text>
          </Body>
        </Section>

        <Text style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 8 }}>
          Official website copies:{' '}
          <Text style={linkStyle} onPress={() => openUrlDeferred(TERMS_WEB_URL)}>
            Terms & conditions
          </Text>
          {' · '}
          <Text style={linkStyle} onPress={() => openUrlDeferred(getPrivacyPolicyUrl())}>
            Privacy policy
          </Text>
        </Text>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: Theme;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 17,
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: 10,
          lineHeight: 24,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Body({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return (
    <Text
      style={{
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 22,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

function AlertBanner({ message, theme }: { message: string; theme: Theme }) {
  return (
    <View
      style={{
        backgroundColor: theme.dark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: theme.dark ? '#fca5a5' : '#b91c1c',
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      gap: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerTitleGroup: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    lastUpdated: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginBottom: 24,
      fontStyle: 'italic',
    },
  });
}
