import React, { useState, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { RootStackParamList } from '../../types/navigation';
import { AvatarVariantPicker } from '../../components/ui/avatar';
import { DEFAULT_AVATAR_VARIANT } from '../../components/ui/avatar/avatarVariants';
import { markTermsAcceptancePending } from '../../lib/termsAcceptance';
import { SIGNUP_VERIFY_EMAIL_MESSAGE } from '../../constants/authMessages';


type SignupNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SignupScreen() {
  const navigation = useNavigation<SignupNavigationProp>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [avatarSeed, setAvatarSeed] = useState(DEFAULT_AVATAR_VARIANT);
  const [signupSuccess, setSignupSuccess] = useState<{
    email: string;
    needsEmailVerification: boolean;
  } | null>(null);
  const { signUp, acceptCommunityTerms } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createSignupStyles(theme), [theme]);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please read and agree to the Terms of Service and Community Guidelines before creating your account.');
      return;
    }

    setLoading(true);
    const { error, needsEmailVerification, signupEmailNotProvisioned } = await signUp(
      email,
      password,
      fullName,
      avatarSeed,
    );

    if (!error) {
      if (needsEmailVerification || signupEmailNotProvisioned) {
        await markTermsAcceptancePending();
      } else {
        const { error: termsError } = await acceptCommunityTerms();
        if (termsError) {
          console.warn('[Signup] terms acceptance:', termsError.message);
        }
      }
    }

    setLoading(false);

    if (error) {
      Alert.alert('Signup Failed', typeof error === 'string' ? error : error.message || 'Signup failed.');
    } else if (signupEmailNotProvisioned) {
      Alert.alert(
        'This email may already be in use',
        'No new signup email was sent for this address. Try signing in, or use Forgot password if you already registered. If you are sure you are new here, try a different email or contact support.'
      );
    } else {
      setSignupSuccess({
        email: email.trim().toLowerCase(),
        needsEmailVerification: Boolean(needsEmailVerification),
      });
    }
  };

  if (signupSuccess) {
    const { email: successEmail, needsEmailVerification } = signupSuccess;
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.verificationSuccessWrap}>
          <View style={[styles.verificationIconCircle, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons
              name={needsEmailVerification ? 'mail-unread-outline' : 'checkmark-circle-outline'}
              size={40}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.verificationSuccessTitle, { color: theme.colors.text }]}>Account created</Text>
          <Text style={[styles.verificationSuccessBody, { color: theme.colors.textSecondary }]}>
            {needsEmailVerification
              ? SIGNUP_VERIFY_EMAIL_MESSAGE
              : 'Welcome to GKP Radio! Your account is ready — you are signed in.'}
          </Text>
          {needsEmailVerification ? (
            <Pressable
              style={[styles.signupButton, { marginTop: 24 }]}
              onPress={() =>
                navigation.replace('ConfirmEmail', {
                  email: successEmail,
                  fromSignup: true,
                })
              }
            >
              <Text style={styles.signupButtonText}>Enter verification code</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          ) : (
            <Pressable
              style={[styles.signupButton, { marginTop: 24 }]}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('MainTabs');
                }
              }}
            >
              <Text style={styles.signupButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#047857', '#059669', '#0d9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {navigation.canGoBack() && (
              <Pressable style={styles.closeButton} onPress={() => navigation.goBack()} hitSlop={12}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            )}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>GKP</Text>
            </View>
            <Text style={styles.title}>Join Our Community</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </LinearGradient>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={theme.colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={theme.colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="At least 6 characters"
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            <AvatarVariantPicker
              selectedSeed={avatarSeed}
              onSelect={setAvatarSeed}
              disabled={loading}
            />

            {/* EULA / Terms Agreement */}
            <View style={styles.termsRow} accessibilityRole="none">
              <Pressable
                onPress={() => setAgreedToTerms((prev) => !prev)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreedToTerms }}
                accessibilityLabel="Agree to Terms of Service and Community Guidelines"
                hitSlop={6}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </Pressable>
              <Text style={styles.termsText}>
                I confirm I am at least 18 years old and agree to the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('TermsOfService')}
                  accessibilityRole="link"
                >
                  Terms of Service & Community Guidelines
                </Text>
                , including zero tolerance for objectionable content and abusive users.
              </Text>
            </View>

            <Pressable
              style={[styles.signupButton, (!agreedToTerms || loading) && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={!agreedToTerms || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.signupButtonText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </Pressable>

            <Pressable
              style={styles.verifyCodePrompt}
              onPress={() =>
                navigation.navigate('ConfirmEmail', {
                  email: email.trim().toLowerCase() || undefined,
                })
              }
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Enter email verification code from signup email"
            >
              <Text style={styles.verifyCodePromptText}>Have a verification code?</Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={styles.loginPrompt} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginPromptText}>
                Already have an account?{' '}
                <Text style={styles.loginLink}>Sign in</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createSignupStyles(theme: Theme) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  verificationSuccessWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  verificationIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verificationSuccessTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  verificationSuccessBody: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  formContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  eyeIcon: {
    padding: 8,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    height: 56,
    marginTop: 12,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  signupButtonDisabled: {
    opacity: 0.4,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  verifyCodePrompt: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  verifyCodePromptText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  loginPrompt: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginPromptText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  });
}
