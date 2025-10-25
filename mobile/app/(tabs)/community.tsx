import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Thread {
  id: number;
  title: string;
  content: string;
  category: string;
  likes: number;
  commentcount: number;
  createdat: string;
  authorid: number;
}

export default function CommunityScreen() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'prayers' | 'testimonies'>('prayers');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchThreads();
  }, [activeTab]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const category = activeTab === 'prayers' ? 'Prayer Request' : 'Testimony';
      
      const { data, error } = await supabase
        .from('community_threads')
        .select('*')
        .eq('category', category)
        .order('createdat', { ascending: false })
        .limit(20);

      if (error) {
        setError(error.message);
        return;
      }

      if (data) {
        setThreads(data);
      }
    } catch (err: any) {
      console.error('Error fetching threads:', err);
      setError(err.message || 'Failed to load community threads');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchThreads();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSubtitle}>Share prayers & testimonies</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'prayers' && styles.activeTab]}
          onPress={() => setActiveTab('prayers')}
        >
          <Ionicons 
            name="heart" 
            size={18} 
            color={activeTab === 'prayers' ? '#047857' : '#71717a'} 
          />
          <Text style={[styles.tabText, activeTab === 'prayers' && styles.activeTabText]}>
            Prayers
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'testimonies' && styles.activeTab]}
          onPress={() => setActiveTab('testimonies')}
        >
          <Ionicons 
            name="sparkles" 
            size={18} 
            color={activeTab === 'testimonies' ? '#047857' : '#71717a'} 
          />
          <Text style={[styles.tabText, activeTab === 'testimonies' && styles.activeTabText]}>
            Testimonies
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#047857" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorTitle}>Unable to load content</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => {
              setLoading(true);
              fetchThreads();
            }}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : threads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#d4d4d8" />
            <Text style={styles.emptyText}>
              No {activeTab} yet. Be the first to share!
            </Text>
          </View>
        ) : (
          <View style={styles.threadsList}>
            {threads.map((thread) => (
              <Pressable key={thread.id} style={styles.threadCard}>
                <Text style={styles.threadTitle} numberOfLines={2}>
                  {thread.title}
                </Text>
                <Text style={styles.threadContent} numberOfLines={3}>
                  {thread.content}
                </Text>
                
                <View style={styles.threadFooter}>
                  <View style={styles.threadStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="heart-outline" size={16} color="#71717a" />
                      <Text style={styles.statText}>{thread.likes || 0}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="chatbubble-outline" size={16} color="#71717a" />
                      <Text style={styles.statText}>{thread.commentcount || 0}</Text>
                    </View>
                  </View>
                  <Text style={styles.threadTime}>{formatDate(thread.createdat)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <Pressable style={styles.fab}>
        <Ionicons name="add" size={24} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#09090b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#71717a',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#f0fdf4',
    borderColor: '#047857',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717a',
  },
  activeTabText: {
    color: '#047857',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#71717a',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#047857',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  threadsList: {
    padding: 16,
    gap: 12,
  },
  threadCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 8,
  },
  threadContent: {
    fontSize: 14,
    color: '#71717a',
    lineHeight: 20,
    marginBottom: 12,
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#71717a',
  },
  threadTime: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#047857',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
