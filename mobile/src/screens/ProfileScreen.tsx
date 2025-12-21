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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { Episode, Video } from '../types/database.types';
import * as Haptics from 'expo-haptics';

interface ProfileData {
  fullname: string | null;
  bio: string | null;
  avatarurl: string | null;
  created_at: string;
}

type SavedTab = 'episodes' | 'videos';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme, isDark } = useTheme();
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
        .filter(b => b.content_type === 'episode')
        .map(b => b.content_id);
      
      const videoIds = bookmarks
        .filter(b => b.content_type === 'video')
        .map(b => b.content_id);

      const [episodesResult, videosResult] = await Promise.all([
        episodeIds.length > 0
          ? supabase
              .from('episodes')
              .select('*')
              .in('id', episodeIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        videoIds.length > 0
          ? supabase
              .from('videos')
              .select('*')
              .in('id', videoIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (episodesResult.error) {
        console.error('Error fetching saved episodes:', episodesResult.error);
      }
      if (videosResult.error) {
        console.error('Error fetching saved videos:', videosResult.error);
      }

      setSavedEpisodes(episodesResult.data || []);
      setSavedVideos(videosResult.data || []);
    } catch (error) {
      console.error('Error fetching saved content:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFullName(data.fullname || '');
        setBio(data.bio || '');
      } else {
        setProfile(null);
        setFullName('');
        setBio('');
      }
    } catch (error) {
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
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          fullname: fullName.trim() || null,
          bio: bio.trim() || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Unable to update profile. Please try again.');
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

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      'Delete Account',
      'WARNING: This action is permanent. All your data, including prayer requests and testimonies, will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setSaving(true);

                      // 1. Call the Edge Function to delete the auth user
                      // This ensures complete account erasure as required by Apple
                      const { data, error: functionError } = await supabase.functions.invoke('delete-user');

                      if (functionError) throw functionError;

                      // 2. Sign out locally
                      await signOut();

                      Alert.alert('Account Deleted', 'Your account and all associated data have been permanently removed.');
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      Alert.alert(
                        'Deletion Error',
                        'Unable to complete account deletion automatically. Please contact support@gkpradio.com to manually request deletion.'
                      );
                    } finally {
                      setSaving(false);
                    }
                  }
                }
              ]
            );
          }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#047857" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
                  <View 
                    key={episode.id} 
                    style={[styles.savedCard, { backgroundColor: theme.colors.surface }]}
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
                      onPress={() => handleRemoveBookmark('episode', episode.id)}
                      hitSlop={10}
                    >
                      <Ionicons name="bookmark" size={22} color={theme.colors.primary} />
                    </Pressable>
                  </View>
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
                  <View 
                    key={video.id} 
                    style={[styles.savedCard, { backgroundColor: theme.colors.surface }]}
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
                      onPress={() => handleRemoveBookmark('video', video.id)}
                      hitSlop={10}
                    >
                      <Ionicons name="bookmark" size={22} color={theme.colors.primary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={24} color="#71717a" />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d4d4d8" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={24} color="#71717a" />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d4d4d8" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle-outline" size={24} color="#71717a" />
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d4d4d8" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="information-circle-outline" size={24} color="#71717a" />
                <Text style={styles.settingText}>About</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d4d4d8" />
            </Pressable>

            <View style={styles.divider} />

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
