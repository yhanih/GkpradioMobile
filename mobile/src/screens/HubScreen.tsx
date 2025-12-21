import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type HubNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

function SettingItem({ icon, label, onPress, showChevron = true, rightElement, destructive }: SettingItemProps) {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.settingItem,
        pressed && styles.settingItemPressed
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconContainer, destructive && styles.settingIconDestructive]}>
          <Ionicons name={icon} size={20} color={destructive ? '#ef4444' : '#047857'} />
        </View>
        <Text style={[styles.settingText, destructive && styles.settingTextDestructive]}>{label}</Text>
      </View>
      {rightElement || (showChevron && <Ionicons name="chevron-forward" size={20} color="#d4d4d8" />)}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionTitle}>{title}</Text>
  );
}

export function HubScreen() {
  const navigation = useNavigation<HubNavigationProp>();
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@gkpradio.com');
  };

  const handleVisitWebsite = () => {
    Linking.openURL('https://gkpradio.com');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://gkpradio.com/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://gkpradio.com/terms');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#047857', '#059669', '#0d9488']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.hubIconContainer}>
            <Ionicons name="apps" size={32} color="#047857" />
          </View>
          <Text style={styles.headerTitle}>Hub</Text>
          <Text style={styles.headerSubtitle}>Settings & More</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {user && (
          <View style={styles.section}>
            <SectionHeader title="Account" />
            <View style={styles.card}>
              <SettingItem
                icon="person-outline"
                label="My Profile"
                onPress={() => navigation.navigate('Profile')}
              />
              <View style={styles.divider} />
              <SettingItem
                icon="bookmark-outline"
                label="Saved Posts"
                onPress={() => {}}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title="Preferences" />
          <View style={styles.card}>
            <SettingItem
              icon="notifications-outline"
              label="Push Notifications"
              showChevron={false}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(value) => {
                    Haptics.selectionAsync();
                    setNotificationsEnabled(value);
                  }}
                  trackColor={{ false: '#e4e4e7', true: '#86efac' }}
                  thumbColor={notificationsEnabled ? '#047857' : '#fafafa'}
                />
              }
            />
            <View style={styles.divider} />
            <SettingItem
              icon="moon-outline"
              label="Dark Mode"
              showChevron={false}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={() => {
                    Haptics.selectionAsync();
                    toggleTheme();
                  }}
                  trackColor={{ false: '#e4e4e7', true: '#86efac' }}
                  thumbColor={isDark ? '#047857' : '#fafafa'}
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Support" />
          <View style={styles.card}>
            <SettingItem
              icon="help-circle-outline"
              label="Help Center"
              onPress={handleContactSupport}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="mail-outline"
              label="Contact Support"
              onPress={handleContactSupport}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="chatbubble-outline"
              label="Send Feedback"
              onPress={handleContactSupport}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="About" />
          <View style={styles.card}>
            <SettingItem
              icon="globe-outline"
              label="Visit Website"
              onPress={handleVisitWebsite}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={handlePrivacyPolicy}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="shield-checkmark-outline"
              label="Terms of Service"
              onPress={handleTermsOfService}
            />
            <View style={styles.divider} />
            <View style={styles.versionRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="information-circle-outline" size={20} color="#047857" />
                </View>
                <Text style={styles.settingText}>Version</Text>
              </View>
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
          </View>
        </View>

        {user && (
          <View style={styles.section}>
            <Pressable 
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </View>
        )}

        {!user && (
          <View style={styles.section}>
            <Pressable 
              style={({ pressed }) => [styles.loginButton, pressed && styles.loginButtonPressed]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.loginButtonText}>Sign In / Sign Up</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>God Kingdom Principles Radio</Text>
          <Text style={styles.footerSubtext}>Spreading the Gospel through radio</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  hubIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingItemPressed: {
    backgroundColor: '#f4f4f5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIconDestructive: {
    backgroundColor: '#fef2f2',
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#18181b',
  },
  settingTextDestructive: {
    color: '#ef4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#f4f4f5',
    marginLeft: 64,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutButtonPressed: {
    backgroundColor: '#fef2f2',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047857',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonPressed: {
    backgroundColor: '#059669',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#d4d4d8',
    marginTop: 4,
  },
  bottomPadding: {
    height: 100,
  },
});
