import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { HELP_DESK_EMAIL } from '../constants/contact';
import { RootStackParamList } from '../types/navigation';

const LAST_UPDATED = 'May 13, 2026';

type PrivacyNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function PrivacyPolicyScreen() {
  const navigation = useNavigation<PrivacyNavigationProp>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSubtitle}>GKP Radio</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

        {/* Intro */}
        <Section title="Our Commitment" theme={theme}>
          <Body theme={theme}>
            At GKP Radio, we are dedicated to protecting your privacy and ensuring you have a safe, 
            uplifting, and secure experience in our faith-based digital community. This Privacy Policy 
            explains how we collect, use, disclose, and safeguard your information when you use our 
            mobile application.
          </Body>
          <Body theme={theme}>
            By creating an account or using the App, you consent to the data collection and usage practices 
            described in this policy. If you do not agree with these terms, please do not use the App.
          </Body>
        </Section>

        {/* 1. Information We Collect */}
        <Section title="1. Information We Collect" theme={theme}>
          <Body theme={theme}>
            We collect personal information that you voluntarily provide to us when registering, 
            interacting with our community features, or contacting support. This includes:
          </Body>
          <Body theme={theme}>
            {'• '} <Text style={{ fontWeight: '700', color: theme.colors.text }}>Account Data:</Text> Full name, email address, password, and chosen avatar seed/image.{'\n'}
            {'• '} <Text style={{ fontWeight: '700', color: theme.colors.text }}>User Generated Content (UGC):</Text> Testimonies, prayer requests, comments, posts, and chat messages.{'\n'}
            {'• '} <Text style={{ fontWeight: '700', color: theme.colors.text }}>Interaction Details:</Text> Likes, bookmarks, saved episodes, and communication logs.{'\n'}
            {'• '} <Text style={{ fontWeight: '700', color: theme.colors.text }}>Notification Settings:</Text> Preferences for push notifications and device tokens (if enabled).
          </Body>
        </Section>

        {/* 2. How We Use Your Information */}
        <Section title="2. How We Use Your Information" theme={theme}>
          <Body theme={theme}>
            We use the information we collect to provide and improve our services, facilitate community interactions, 
            and support our ministry outreach:
          </Body>
          <Body theme={theme}>
            {'• '} To deliver and manage our 24/7 radio broadcast and media library.{'\n'}
            {'• '} To enable community features like posting testimonies and commenting.{'\n'}
            {'• '} To process and display prayer requests and group interactions.{'\n'}
            {'• '} To send notifications about system updates and relevant community activity.{'\n'}
            {'• '} To moderate community spaces, enforce our Zero-Tolerance UGC policy, and prevent abuse.{'\n'}
            {'• '} To resolve technical support requests and communicate with you.
          </Body>
        </Section>

        {/* 3. Information Sharing */}
        <Section title="3. Information Sharing" theme={theme}>
          <Body theme={theme}>
            We do not sell, trade, or rent your personal information to third parties. We may share your 
            information only in the following limited circumstances:
          </Body>
          <Body theme={theme}>
            {'• '} <Text style={{ fontWeight: '700', color: theme.colors.text }}>With Consent:</Text> When you explicitly choose to share content publicly or with specific users.{'\n'}
            {'• '} <Text style={{ fontWeight: '700', color: theme.colors.text }}>Service Providers:</Text> Trusted third-party vendors (like Supabase for database management and Expo for notifications) under strict confidentiality agreements.{'\n'}
            {'• '} <Text style={{ fontWeight: '700', color: theme.colors.text }}>Legal Compliance:</Text> If required to do so by law, or to protect the safety, rights, and security of GKP Radio and our community members.
          </Body>
        </Section>

        {/* 4. Data Security */}
        <Section title="4. Data Security" theme={theme}>
          <Body theme={theme}>
            We implement industry-standard technical and organizational security measures to shield your personal 
            information from unauthorized access, modification, exposure, or loss. However, please remember that 
            no method of transmission over the internet or mobile network is 100% secure, and we cannot guarantee 
            absolute security.
          </Body>
        </Section>

        {/* 5. Your Rights */}
        <Section title="5. Your Rights" theme={theme}>
          <Body theme={theme}>
            You maintain full control over your personal data:
          </Body>
          <Body theme={theme}>
            {'• '} <Text style={{ fontWeight: '700', color: theme.colors.text }}>Update Account Info:</Text> Modify your name, bio, and avatar within the profile settings.{'\n'}
            {'• '} <Text style={{ fontWeight: '700', color: theme.colors.text }}>Delete Account & Data:</Text> You can permanently delete your account and all associated personal data directly within the app (Profile → Delete Account).{'\n'}
            {'• '} <Text style={{ fontWeight: '700', color: theme.colors.text }}>Notification Controls:</Text> Toggle push notifications off at any time under settings.
          </Body>
        </Section>

        {/* 6. Cookies & Mobile Tracking */}
        <Section title="6. Cookies & Mobile Tracking" theme={theme}>
          <Body theme={theme}>
            We use secure local storage identifiers (like AsyncStorage) on your device to keep you logged in and 
            remember your local preferences (such as dark mode and notification preferences). We do not perform cross-app 
            behavioral tracking or share device data with advertising networks.
          </Body>
        </Section>

        {/* 7. Children's Privacy */}
        <Section title="7. Children's Privacy" theme={theme}>
          <Body theme={theme}>
            Our community features and live chat require users to be at least 18 years old. GKP Radio does not knowingly 
            collect or solicit personal information from children under 13. If we discover we have accidentally collected data 
            from a child under 13, we will immediately delete that information from our systems.
          </Body>
        </Section>

        {/* 8. Changes to This Policy */}
        <Section title="8. Changes to This Policy" theme={theme}>
          <Body theme={theme}>
            We may update our Privacy Policy periodically. We will notify you of any changes by updating the "Last updated" 
            date at the top of this page. Your continued use of GKP Radio after changes are made constitutes your 
            acceptance of the new Privacy Policy.
          </Body>
        </Section>

        {/* 9. Contact Us */}
        <Section title="9. Contact Us" theme={theme}>
          <Body theme={theme}>
            If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact our support team at:
          </Body>
          <Body theme={theme}>
            {'• '} Email: <Text style={{ fontWeight: '700', color: theme.colors.text }}>{HELP_DESK_EMAIL}</Text>{'\n'}
            {'• '} Official website: <Text style={{ fontWeight: '700', color: theme.colors.text }}>godkingdomprinciplesradio.com</Text>
          </Body>
        </Section>

        {/* Scripture Citation */}
        <View style={styles.scriptureContainer}>
          <Text style={styles.scriptureText}>
            "The Lord your God is in your midst, a mighty one who will save; he will rejoice over you with gladness; he will quiet you by his love; he will exult over you with loud singing."
          </Text>
          <Text style={styles.scriptureReference}>— Zephaniah 3:17</Text>
        </View>

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
    scriptureContainer: {
      backgroundColor: theme.dark ? 'rgba(4,120,87,0.12)' : 'rgba(4,120,87,0.06)',
      borderRadius: 16,
      padding: 20,
      marginTop: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    scriptureText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.colors.textSecondary,
      lineHeight: 22,
      textAlign: 'center',
    },
    scriptureReference: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
      marginTop: 10,
      textAlign: 'right',
    },
  });
}
