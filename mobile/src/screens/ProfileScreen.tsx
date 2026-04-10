import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Animated,
  Switch,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wpClient } from '../lib/wordpress';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/navigation';
import * as Haptics from 'expo-haptics';

interface Episode {
  id: string;
  title: string;
  content: string;
  thumbnail_url?: string;
  audio_url?: string;
  created_at?: string;
  category?: string;
}

interface Video {
  id: string;
  title: string;
  content: string;
  thumbnail_url?: string;
  video_url?: string;
  created_at?: string;
  category?: string;
}

interface ProfileData {
  fullname: string | null;
  bio: string | null;
  avatarurl: string | null;
  created_at: string;
}

type SavedTab = 'episodes' | 'videos';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, signOut } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const handleLeaveProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };
  const { bookmarks, refreshBookmarks, toggleBookmark, isBookmarked } = useBookmarks();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savedTab, setSavedTab] = useState<SavedTab>('episodes');
  const [savedEpisodes, setSavedEpisodes] = useState<Episode[]>([]);
  const [savedVideos, setSavedVideos] = useState<Video[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (user && bookmarks.length > 0) {
      fetchSavedContent();
    } else {
      setSavedEpisodes([]);
      setSavedVideos([]);
    }
  }, [user, bookmarks]);

  const fetchSavedContent = async () => {
    if (!user) return;
    
    try {
      setLoadingSaved(true);
      
      const episodeIds = bookmarks
        .filter((b: any) => b.content_type === 'episode')
        .map((b: any) => b.content_id);
      
      const videoIds = bookmarks
        .filter((b: any) => b.content_type === 'video')
        .map((b: any) => b.content_id);

      const [episodesResult, videosResult] = await Promise.all([
        episodeIds.length > 0
          ? wpClient.getPodcasts(100, episodeIds)
          : Promise.resolve({ data: [], error: null }),
        videoIds.length > 0
          ? wpClient.getVideos(100, videoIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      setSavedEpisodes((episodesResult.data || []).map(p => ({
        id: String(p.id),
        title: p.title.rendered,
        content: p.content.rendered,
        thumbnail_url: p.thumbnail_url,
        audio_url: p.audio_url,
        created_at: p.date,
        category: 'Podcast'
      } as any)));
      
      setSavedVideos((videosResult.data || []).map(v => ({
        id: String(v.id),
        title: v.title.rendered,
        content: v.content.rendered,
        thumbnail_url: v.thumbnail_url,
        video_url: v.video_url,
        created_at: v.date,
        category: 'Video'
      } as any)));
    } catch (error) {
      console.error('Error fetching saved content:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await wpClient.getMe();
      if (error) throw new Error(error);

      if (data) {
        setProfile({
          fullname: data.name,
          bio: data.description,
          avatarurl: data.avatar_urls?.['96'] || null,
          created_at: new Date().toISOString(),
        } as any);
        setFullName(data.name || '');
        setBio(data.description || '');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Unable to load profile. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), refreshBookmarks()]);
    setRefreshing(false);
  };

  const handleRemoveBookmark = async (contentType: 'episode' | 'video', contentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (contentType === 'episode') {
      setSavedEpisodes(prev => prev.filter(ep => ep.id !== contentId));
    } else {
      setSavedVideos(prev => prev.filter(vid => vid.id !== contentId));
    }
    
    try {
      await toggleBookmark(contentType, contentId);
    } catch (error) {
      fetchSavedContent();
      Alert.alert('Error', 'Could not remove bookmark. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await wpClient.updateMe({
        fullname: fullName.trim(),
        bio: bio.trim()
      });

      if (error) throw new Error(error);

      Alert.alert('Success', 'Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Unable to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(profile?.fullname || '');
    setBio(profile?.bio || '');
    setEditing(false);
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

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Account',
      'If you wish to delete your account, please contact our support team at support@gkpradio.com.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Contact Support', 
          onPress: () => Linking.openURL('mailto:support@gkpradio.com?subject=Account%20Deletion%20Request') 
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const profileNavBar = (
    <View
      style={[
        styles.profileNavBar,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
      ]}
    >
      <View style={styles.profileNavSide}>
        <Pressable
          onPress={handleLeaveProfile}
          style={styles.profileNavBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back to previous screen"
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          <Text style={[styles.profileNavBackLabel, { color: theme.colors.primary }]}>Back</Text>
        </Pressable>
      </View>
      <Text style={[styles.profileNavTitleCenter, { color: theme.colors.text }]} pointerEvents="none">
        Profile
      </Text>
      <View style={styles.profileNavSide} />
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {profileNavBar}
        <LinearGradient
          colors={['#047857', '#059669', '#0d9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.authGateHeader}
        >
          <View style={styles.authGateLogo}>
            <Text style={styles.authGateLogoText}>GKP</Text>
          </View>
          <Text style={styles.authGateTitle}>Your Profile</Text>
          <Text style={styles.authGateSubtitle}>
            Sign in to access your profile, saved content and community features
          </Text>
        </LinearGradient>

        <View style={styles.authGateBody}>
          <View style={styles.authGateFeatureList}>
            {[
              { icon: 'bookmark-outline', label: 'Save episodes & videos' },
              { icon: 'heart-outline', label: 'Like & engage with posts' },
              { icon: 'people-outline', label: 'Join the community' },
              { icon: 'person-outline', label: 'Manage your profile' },
            ].map((item) => (
              <View key={item.label} style={styles.authGateFeatureRow}>
                <View style={styles.authGateFeatureIcon}>
                  <Ionicons name={item.icon as any} size={20} color="#047857" />
                </View>
                <Text style={styles.authGateFeatureLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.authGateSignInBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.authGateSignInBtnText}>Sign In</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>

          <Pressable
            style={styles.authGateSignUpBtn}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.authGateSignUpBtnText}>
              Don't have an account? <Text style={{ color: '#047857', fontWeight: '700' }}>Sign Up</Text>
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {profileNavBar}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#047857" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {profileNavBar}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#047857', '#059669', '#0d9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={48} color="#047857" />
              </View>
            </View>
            <Text style={styles.headerName}>
              {fullName || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.headerEmail}>{user?.email}</Text>
          </View>
        </LinearGradient>

        {/* Profile Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            {!editing && (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setEditing(true);
                }}
                style={styles.editButton}
              >
                <Ionicons name="create-outline" size={20} color="#047857" />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                editable={editing}
                placeholderTextColor="#a1a1aa"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.textArea, !editing && styles.inputDisabled]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={4}
                editable={editing}
                placeholderTextColor="#a1a1aa"
                textAlignVertical="top"
              />
            </View>

            {editing && (
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    handleCancel();
                  }}
                  style={[styles.button, styles.cancelButton]}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleSave();
                  }}
                  style={[styles.button, styles.saveButton]}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="mail-outline" size={20} color="#71717a" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
            </View>

            {profile?.created_at && (
              <View style={styles.infoRow}>
                <View style={[styles.infoIconContainer, { backgroundColor: isDark ? theme.colors.surfaceSecondary : '#f4f4f5' }]}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Member Since</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{formatDate(profile.created_at)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Saved Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Saved</Text>
            <View style={styles.savedBadge}>
              <Text style={[styles.savedBadgeText, { color: theme.colors.primary }]}>
                {savedEpisodes.length + savedVideos.length}
              </Text>
            </View>
          </View>

          {/* Saved Tabs */}
          <View style={[styles.savedTabs, { backgroundColor: theme.colors.surface }]}>
            <Pressable
              style={[
                styles.savedTab,
                savedTab === 'episodes' && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSavedTab('episodes');
              }}
            >
              <Ionicons 
                name="headset" 
                size={18} 
                color={savedTab === 'episodes' ? '#fff' : theme.colors.textMuted} 
              />
              <Text style={[
                styles.savedTabText,
                { color: savedTab === 'episodes' ? '#fff' : theme.colors.textMuted }
              ]}>
                Episodes ({savedEpisodes.length})
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.savedTab,
                savedTab === 'videos' && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSavedTab('videos');
              }}
            >
              <Ionicons 
                name="videocam" 
                size={18} 
                color={savedTab === 'videos' ? '#fff' : theme.colors.textMuted} 
              />
              <Text style={[
                styles.savedTabText,
                { color: savedTab === 'videos' ? '#fff' : theme.colors.textMuted }
              ]}>
                Videos ({savedVideos.length})
              </Text>
            </Pressable>
          </View>

          {/* Saved Content */}
          {loadingSaved ? (
            <View style={styles.savedLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : savedTab === 'episodes' ? (
            savedEpisodes.length === 0 ? (
              <View style={[styles.savedEmpty, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="bookmark-outline" size={40} color={theme.colors.textMuted} />
                <Text style={[styles.savedEmptyTitle, { color: theme.colors.text }]}>No Saved Episodes</Text>
                <Text style={[styles.savedEmptyText, { color: theme.colors.textMuted }]}>
                  Tap the bookmark icon on episodes to save them here
                </Text>
              </View>
            ) : (
              <View style={styles.savedList}>
                {savedEpisodes.map((episode) => (
                  <Pressable 
                    key={episode.id} 
                    style={[styles.savedCard, { backgroundColor: theme.colors.surface }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      navigation.navigate('EpisodePlayer', { episode });
                    }}
                  >
                    <Image
                      source={{ uri: episode.thumbnail_url || 'https://via.placeholder.com/60' }}
                      style={styles.savedCardImage}
                    />
                    <View style={styles.savedCardInfo}>
                      <Text style={[styles.savedCardTitle, { color: theme.colors.text }]} numberOfLines={2}>
                        {episode.title}
                      </Text>
                      <Text style={[styles.savedCardMeta, { color: theme.colors.textMuted }]}>
                        {episode.category || 'Podcast'}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.savedCardRemove}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveBookmark('episode', episode.id);
                      }}
                      hitSlop={10}
                    >
                      <Ionicons name="bookmark" size={22} color={theme.colors.primary} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )
          ) : (
            savedVideos.length === 0 ? (
              <View style={[styles.savedEmpty, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="bookmark-outline" size={40} color={theme.colors.textMuted} />
                <Text style={[styles.savedEmptyTitle, { color: theme.colors.text }]}>No Saved Videos</Text>
                <Text style={[styles.savedEmptyText, { color: theme.colors.textMuted }]}>
                  Tap the bookmark icon on videos to save them here
                </Text>
              </View>
            ) : (
              <View style={styles.savedList}>
                {savedVideos.map((video) => (
                  <Pressable 
                    key={video.id} 
                    style={[styles.savedCard, { backgroundColor: theme.colors.surface }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      navigation.navigate('VideoPlayer', { video });
                    }}
                  >
                    <Image
                      source={{ uri: video.thumbnail_url || 'https://via.placeholder.com/60' }}
                      style={styles.savedCardImage}
                    />
                    <View style={styles.savedCardInfo}>
                      <Text style={[styles.savedCardTitle, { color: theme.colors.text }]} numberOfLines={2}>
                        {video.title}
                      </Text>
                      <Text style={[styles.savedCardMeta, { color: theme.colors.textMuted }]}>
                        {video.category || 'Video'}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.savedCardRemove}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveBookmark('video', video.id);
                      }}
                      hitSlop={10}
                    >
                      <Ionicons name="bookmark" size={22} color={theme.colors.primary} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Settings</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Pressable 
              style={styles.settingItem}
              onPress={() => {
                Haptics.selectionAsync();
                Alert.alert(
                  'Notifications',
                  'Notification settings can be managed in your device settings.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() }
                  ]
                );
              }}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={24} color={theme.colors.textMuted} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={24} color={theme.colors.textMuted} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => {
                  Haptics.selectionAsync();
                  toggleTheme();
                }}
                trackColor={{ false: '#e4e4e7', true: '#047857' }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <Pressable 
              style={styles.settingItem}
              onPress={() => {
                Haptics.selectionAsync();
                Linking.openURL('mailto:support@gkpradio.com?subject=Help%20Request');
              }}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle-outline" size={24} color={theme.colors.textMuted} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <Pressable 
              style={styles.settingItem}
              onPress={() => {
                Haptics.selectionAsync();
                Alert.alert(
                  'GKP Radio',
                  'Version 1.0.0\n\nGod Kingdom Principles Radio\n\nSpread the Gospel through Faith, Prayer & Community.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="information-circle-outline" size={24} color={theme.colors.textMuted} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>About</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <Pressable style={styles.settingItem} onPress={handleDeleteAccount}>
              <View style={styles.settingLeft}>
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
                <Text style={[styles.settingText, { color: '#ef4444' }]}>Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fee2e2" />
            </Pressable>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
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
  profileNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  profileNavSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  profileNavBack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 2,
  },
  profileNavBackLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  profileNavTitleCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    zIndex: -1,
  },
  // Auth gate styles
  authGateHeader: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  authGateLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  authGateLogoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  authGateTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  authGateSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  authGateBody: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 28,
    paddingTop: 36,
  },
  authGateFeatureList: {
    gap: 16,
    marginBottom: 36,
  },
  authGateFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  authGateFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authGateFeatureLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#18181b',
  },
  authGateSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047857',
    borderRadius: 14,
    height: 56,
    gap: 8,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  authGateSignInBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  authGateSignUpBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  authGateSignUpBtnText: {
    fontSize: 14,
    color: '#71717a',
  },
  // Core layout
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#71717a',
  },
  header: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181b',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3f3f46',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#18181b',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  textArea: {
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#18181b',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    minHeight: 100,
  },
  inputDisabled: {
    backgroundColor: '#fafafa',
    color: '#71717a',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#71717a',
  },
  saveButton: {
    backgroundColor: '#047857',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#71717a',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#18181b',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#18181b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f4f4f5',
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
    borderColor: '#fee2e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  savedBadge: {
    backgroundColor: 'rgba(4, 120, 87, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savedBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  savedTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  savedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  savedTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  savedLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  savedEmpty: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  savedEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  savedEmptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  savedList: {
    gap: 12,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  savedCardImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#e4e4e7',
  },
  savedCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  savedCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  savedCardMeta: {
    fontSize: 13,
  },
  savedCardRemove: {
    padding: 8,
  },
  bottomPadding: {
    height: 100,
  },
});
