import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
  Linking,
  Alert,
  ActivityIndicator,
  Image,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { wpClient } from '../lib/wordpress';
import { registerForPushNotifications } from '../lib/notifications';
import * as Notifications from 'expo-notifications';

type HubNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HEADER_HEIGHT = 180;
const AUDIO_PLAYER_HEIGHT = 100;
const NOTIFICATION_KEY = '@gkp_notifications_enabled';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  theme: any;
}

function SettingItem({ 
  icon, 
  label, 
  subtitle,
  onPress, 
  showChevron = true, 
  rightElement, 
  destructive,
  theme
}: SettingItemProps) {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.settingItem,
        { backgroundColor: pressed ? theme.colors.surfaceSecondary : 'transparent' }
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
    >
      <View style={styles.settingLeft}>
        <View style={[
          styles.settingIconContainer, 
          { backgroundColor: destructive ? '#fef2f2' : theme.colors.primaryLight }
        ]}>
          <Ionicons 
            name={icon} 
            size={20} 
            color={destructive ? '#ef4444' : theme.colors.primary} 
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[
            styles.settingText, 
            { color: destructive ? '#ef4444' : theme.colors.text }
          ]}>
            {label}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement || (showChevron && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      ))}
    </Pressable>
  );
}

function SectionHeader({ title, theme }: { title: string; theme: any }) {
  return (
    <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>{title}</Text>
  );
}

export function HubScreen() {
  const navigation = useNavigation<HubNavigationProp>();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [savedPostsCount, setSavedPostsCount] = useState(0);
  const [userStats, setUserStats] = useState({ posts: 0, likes: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const contentBottomPadding = AUDIO_PLAYER_HEIGHT + insets.bottom + 32;

  useEffect(() => {
    loadNotificationPreference();
    if (user) {
      fetchUserStats();
    } else {
      setLoadingStats(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user && !loadingStats) {
        fetchUserStats();
      }
    }, [user])
  );

  const loadNotificationPreference = async () => {
    try {
      const value = await AsyncStorage.getItem(NOTIFICATION_KEY);
      if (value !== null) {
        setNotificationsEnabled(value === 'true');
      }
    } catch (error) {
      console.error('Error loading notification preference:', error);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_KEY, value.toString());
      setNotificationsEnabled(value);
      Haptics.selectionAsync();

      // Register/deregister push notifications
      if (value) {
        // Register for push notifications
        const token = await registerForPushNotifications();
        if (token && user) {
          // Push token storage in WP meta can be implemented later if endpoint exists
          console.log('Push token:', token);
        }
      }
    } catch (error) {
      console.error('Error saving notification preference:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      setLoadingStats(true);
      
      // Fetch testimonies for this user
      const { data, error } = await wpClient.getTestimonies(100, 1, user.id);
      
      if (!error && data) {
        const count = data.length;
        setUserStats({
          posts: count,
          likes: 0, // WP API might not expose total likes given by a user easily
        });
        setSavedPostsCount(0); // Placeholder for now
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Unable to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openExternalLink = async (url: string, errorMessage: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        Haptics.selectionAsync();
      } else {
        Alert.alert('Unable to Open', errorMessage);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', errorMessage);
    }
  };

  const handleContactSupport = () => {
    openExternalLink(
      'mailto:support@gkpradio.com?subject=GKP%20Radio%20App%20Support',
      'Could not open email app. Please email support@gkpradio.com directly.'
    );
  };

  const handleSendFeedback = () => {
    openExternalLink(
      'mailto:feedback@gkpradio.com?subject=GKP%20Radio%20App%20Feedback',
      'Could not open email app. Please email feedback@gkpradio.com directly.'
    );
  };

  const handleVisitWebsite = () => {
    openExternalLink(
      'https://godkingdomprinciplesradio.com',
      'Could not open browser. Please visit godkingdomprinciplesradio.com manually.'
    );
  };

  const handlePrivacyPolicy = () => {
    openExternalLink(
      'https://godkingdomprinciplesradio.com/privacy-policy/',
      'Could not open browser. Please visit our website manually.'
    );
  };

  const handleTermsOfService = () => {
    openExternalLink(
      'https://godkingdomprinciplesradio.com/terms-and-conditions/',
      'Could not open browser. Please visit our website manually.'
    );
  };

  const handleRateApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      
      if (isAvailable) {
        await StoreReview.requestReview();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        const storeUrl = Platform.select({
          ios: 'https://apps.apple.com/app/gkp-radio/id123456789',
          android: 'https://play.google.com/store/apps/details?id=com.gkpradio.app',
          default: 'https://godkingdomprinciplesradio.com/app',
        });
        
        Alert.alert(
          'Rate GKP Radio',
          'Would you like to rate our app in the store?',
          [
            { text: 'Not Now', style: 'cancel' },
            { 
              text: 'Open Store', 
              onPress: async () => {
                try {
                  await Linking.openURL(storeUrl);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch (err) {
                  Alert.alert('Error', 'Could not open app store.');
                }
              }
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting review:', error);
      Alert.alert('Error', 'Could not open app store. Please try again later.');
    }
  };

  const handleShareApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await Share.share({
        message: Platform.select({
          ios: 'Check out GKP Radio - Faith-based content, live radio, and community!\n\nhttps://godkingdomprinciplesradio.com/app',
          android: 'Check out GKP Radio - Faith-based content, live radio, and community!\n\nhttps://godkingdomprinciplesradio.com/app',
          default: 'Check out GKP Radio!\n\nhttps://godkingdomprinciplesradio.com/app',
        }),
        title: 'Share GKP Radio',
        url: 'https://godkingdomprinciplesradio.com/app',
      });
      
      if (result.action === Share.sharedAction) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Could not share app. Please try again.');
    }
  };

  const getUserInitials = () => {
    if (!user) return 'GK';
    const name = user.name || user.display_name || user.email;
    const parts = name.split(/[ @._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const avatarUrl = user?.avatar_urls?.['96'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
      >
        <LinearGradient
          colors={isDark 
            ? ['#064e3b', '#047857', '#065f46'] 
            : ['#047857', '#059669', '#0d9488']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerContent}>
            {user ? (
              <Pressable 
                style={styles.profileSection}
                onPress={() => {
                  Haptics.selectionAsync();
                  navigation.navigate('Profile');
                }}
              >
                <View style={styles.avatarContainer}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <LinearGradient
                      colors={['#ffffff', '#f0fdf4']}
                      style={styles.avatar}
                    >
                      <Text style={styles.avatarText}>{getUserInitials()}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.onlineIndicator} />
                </View>
                <Text style={styles.welcomeText}>Welcome back!</Text>
                <Text style={styles.emailText}>{user.name || user.username || user.email}</Text>
                
                {!loadingStats && (
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{userStats.posts}</Text>
                      <Text style={styles.statLabel}>Testimonies</Text>
                    </View>
                  </View>
                )}
                {loadingStats && (
                  <ActivityIndicator 
                    size="small" 
                    color="rgba(255,255,255,0.6)" 
                    style={{ marginTop: 16 }} 
                  />
                )}
              </Pressable>
            ) : (
              <View style={styles.guestSection}>
                <View style={styles.hubIconContainer}>
                  <Ionicons name="radio" size={36} color="#047857" />
                </View>
                <Text style={styles.headerTitle}>GKP Radio</Text>
                <Text style={styles.headerSubtitle}>Settings & More</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {user && (
          <View style={styles.section}>
            <SectionHeader title="Account" theme={theme} />
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <SettingItem
                icon="person-outline"
                label="My Profile"
                subtitle="Edit your profile and preferences"
                onPress={() => navigation.navigate('Profile')}
                theme={theme}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title="Preferences" theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="notifications-outline"
              label="Push Notifications"
              subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
              showChevron={false}
              theme={theme}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: theme.colors.border, true: '#86efac' }}
                  thumbColor={notificationsEnabled ? theme.colors.primary : '#fafafa'}
                />
              }
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingItem
              icon={isDark ? 'moon' : 'moon-outline'}
              label="Dark Mode"
              subtitle={isDark ? 'On' : 'Off'}
              showChevron={false}
              theme={theme}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={() => {
                    Haptics.selectionAsync();
                    toggleTheme();
                  }}
                  trackColor={{ false: theme.colors.border, true: '#86efac' }}
                  thumbColor={isDark ? theme.colors.primary : '#fafafa'}
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Share & Rate" theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="share-social-outline"
              label="Share App"
              subtitle="Spread the word about GKP Radio"
              onPress={handleShareApp}
              theme={theme}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingItem
              icon="star-outline"
              label="Rate Us"
              subtitle="Help us improve with your feedback"
              onPress={handleRateApp}
              theme={theme}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Support" theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="help-circle-outline"
              label="Help Center"
              subtitle="FAQs and troubleshooting"
              onPress={handleVisitWebsite}
              theme={theme}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingItem
              icon="mail-outline"
              label="Contact Support"
              subtitle="support@gkpradio.com"
              onPress={handleContactSupport}
              theme={theme}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingItem
              icon="chatbubble-outline"
              label="Send Feedback"
              subtitle="We'd love to hear from you"
              onPress={handleSendFeedback}
              theme={theme}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="About" theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="globe-outline"
              label="Visit Website"
              subtitle="gkpradio.com"
              onPress={handleVisitWebsite}
              theme={theme}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingItem
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={handlePrivacyPolicy}
              theme={theme}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingItem
              icon="shield-checkmark-outline"
              label="Terms of Service"
              onPress={handleTermsOfService}
              theme={theme}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.versionRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.text }]}>App Version</Text>
                </View>
              </View>
              <View style={[styles.versionBadge, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.versionText, { color: theme.colors.primary }]}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        {user ? (
          <View style={styles.section}>
            <Pressable 
              style={({ pressed }) => [
                styles.logoutButton, 
                { backgroundColor: theme.colors.surface },
                pressed && styles.logoutButtonPressed
              ]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            <Pressable 
              style={({ pressed }) => [
                styles.loginButton, 
                { backgroundColor: theme.colors.primary },
                pressed && styles.loginButtonPressed
              ]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.loginButtonText}>Sign In / Sign Up</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.footer}>
          <View style={[styles.footerLogo, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="radio" size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
            God Kingdom Principles Radio
          </Text>
          <Text style={[styles.footerSubtext, { color: theme.colors.textMuted }]}>
            Spreading the Gospel through radio
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#047857',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#047857',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  guestSection: {
    alignItems: 'center',
  },
  hubIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 72,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  versionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  loginButtonPressed: {
    opacity: 0.9,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  footerLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});
