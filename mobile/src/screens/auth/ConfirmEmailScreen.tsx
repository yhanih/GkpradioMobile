import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { RootStackParamList } from '../../types/navigation';
import { SIGNUP_VERIFY_EMAIL_MESSAGE } from '../../constants/authMessages';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ConfirmEmail'>;
type Route = RouteProp<RootStackParamList, 'ConfirmEmail'>;

function normalizeEmailInput(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmailInput(value));
}

export function ConfirmEmailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { verifyEmailOtp, resendSignupConfirmation } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [emailInput, setEmailInput] = useState(() => normalizeEmailInput(route.params?.email ?? ''));
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  useEffect(() => {
    setEmailInput(normalizeEmailInput(route.params?.email ?? ''));
  }, [route.params?.email]);

  const email = normalizeEmailInput(emailInput);

  const onVerify = useCallback(async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Email required', 'Enter the same email you used to sign up.');
      return;
    }
    const digits = code.replace(/\D/g, '');
    if (digits.length < 6) {
      Alert.alert('Enter code', 'Please enter the 6-digit code from your email.');
      return;
    }
    setBusy(true);
    const { error } = await verifyEmailOtp(email, digits);
    setBusy(false);
    if (error) {
      Alert.alert('Verification failed', typeof error === 'string' ? error : error.message || 'Invalid or expired code.');
      return;
    }
    // Reset the entire navigation stack so the modal is fully dismissed
    // and MainTabs becomes the root — prevents the "app closes" appearance
    // that happens when navigating.navigate() is called from inside a modal.
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  }, [code, email, navigation, verifyEmailOtp]);

  const onResend = useCallback(async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Email required', 'Enter your email first, then tap Resend.');
      return;
    }
    setResendBusy(true);
    const { error } = await resendSignupConfirmation(email);
    setResendBusy(false);
    if (error) {
      Alert.alert('Could not resend', error.message || 'Wait a minute and try again, or check your email address.');
    } else {
      Alert.alert('Sent', 'Check your inbox and spam for a new code or link.');
    }
  }, [email, resendSignupConfirmation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#047857', '#059669', '#0d9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Pressable style={styles.closeButton} onPress={() => navigation.goBack()} hitSlop={12}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.title}>Confirm your email</Text>
            <Text style={styles.subtitle}>{SIGNUP_VERIFY_EMAIL_MESSAGE}</Text>
            <Text style={styles.subtitleSecondary}>
              Use the 6-digit code we emailed you, or open the confirmation link on this device.
            </Text>
          </LinearGradient>

          <View style={styles.body}>
            <View style={[styles.verifyBanner, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="mail-unread-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.verifyBannerText, { color: theme.colors.text }]}>
                {SIGNUP_VERIFY_EMAIL_MESSAGE}
              </Text>
            </View>

            <Text style={styles.hint}>
              Enter the email you registered with and the 6-digit code. If your email only has a button link, tap that
              link on this phone instead.
            </Text>

            <Text style={styles.label}>Email</Text>
            <View style={styles.emailWrap}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.textMuted} style={styles.emailIcon} />
              <TextInput
                style={styles.emailInput}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="your@email.com"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!busy}
              />
            </View>

            <Text style={styles.label}>Verification code</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              maxLength={10}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              editable={!busy}
            />

            <Pressable
              style={[styles.primaryBtn, busy && styles.btnDisabled]}
              onPress={onVerify}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify & continue</Text>}
            </Pressable>

            <Pressable
              style={[styles.secondaryBtn, (resendBusy || !isValidEmail(email)) && styles.btnDisabled]}
              onPress={onResend}
              disabled={resendBusy || !isValidEmail(email)}
            >
              {resendBusy ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <Text style={styles.secondaryBtnText}>Resend email</Text>
              )}
            </Pressable>

            <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Go to Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    keyboard: { flex: 1 },
    scroll: { flexGrow: 1 },
    header: {
      paddingTop: 8,
      paddingBottom: 28,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    closeButton: { alignSelf: 'flex-end', padding: 8, marginBottom: 8 },
    title: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center' },
    subtitle: {
      marginTop: 12,
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
      textAlign: 'center',
      paddingHorizontal: 8,
      lineHeight: 22,
    },
    subtitleSecondary: {
      marginTop: 10,
      fontSize: 13,
      color: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      paddingHorizontal: 12,
      lineHeight: 19,
    },
    body: { flex: 1, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 32 },
    verifyBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 14,
      borderRadius: 12,
      marginBottom: 20,
    },
    verifyBannerText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },
    hint: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.colors.textSecondary,
      marginBottom: 20,
    },
    label: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },
    emailWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      marginBottom: 18,
      backgroundColor: theme.colors.surface,
      minHeight: 52,
    },
    emailIcon: { marginRight: 10 },
    emailInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      paddingVertical: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 22,
      letterSpacing: 4,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      marginBottom: 20,
    },
    primaryBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    secondaryBtn: {
      marginTop: 14,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary,
      minHeight: 50,
      justifyContent: 'center',
    },
    secondaryBtnText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
    btnDisabled: { opacity: 0.6 },
    linkRow: { marginTop: 24, alignItems: 'center' },
    link: { fontSize: 15, color: theme.colors.primary, fontWeight: '600' },
  });
}
