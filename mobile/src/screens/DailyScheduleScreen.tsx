import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  host: string;
  description: string;
  type: 'live' | 'music' | 'talk' | 'worship' | 'marriage' | 'testimony' | 'family' | 'faith' | 'youth' | 'finance' | 'meditation';
  day: string;
  duration: string;
}

const SCHEDULE_DATA: ScheduleItem[] = [
  {
    id: '1',
    title: "Wake Up Y'all",
    time: '6:00 AM – 9:00 AM',
    host: "GKPRadio Morning Team",
    description: 'Start your morning with faith-driven conversation, motivation, and music for the soul.',
    type: 'talk',
    day: 'Mon–Fri',
    duration: '3 hours',
  },
  {
    id: '2',
    title: 'In Case You Did Not Know',
    time: '9:00 AM – 10:00 AM',
    host: 'GKPRadio Team',
    description: 'Discover surprising facts and insights you might have missed.',
    type: 'talk',
    day: 'Mon–Fri',
    duration: '1 hour',
  },
  {
    id: '3',
    title: 'Kingdom Teachings with Pastor Myles Monroe',
    time: '10:00 AM – 11:00 AM',
    host: 'Pastor Myles Monroe',
    description: 'Powerful kingdom-focused teaching on purpose, leadership, and spiritual authority.',
    type: 'talk',
    day: 'Mon–Fri',
    duration: '1 hour',
  },
  {
    id: '4',
    title: 'Lunch with Jane Peter',
    time: '11:00 AM – 12:00 PM',
    host: 'Jane Peter',
    description: 'A lunchtime session to inspire and engage through biblical truths and stories.',
    type: 'talk',
    day: 'Mon–Fri',
    duration: '1 hour',
  },
  {
    id: '5',
    title: 'Marriage Talk with Dustin Scott',
    time: '12:00 PM – 1:00 PM',
    host: 'Dustin Scott',
    description: 'Strengthen your relationship with honest conversations about love, faith, and growth.',
    type: 'marriage',
    day: 'Mon–Fri',
    duration: '1 hour',
  },
  {
    id: '6',
    title: 'Testimonies with Stan Lewis',
    time: '1:00 PM – 2:00 PM',
    host: 'Stan Lewis',
    description: "Real-life stories of transformation and God's faithfulness.",
    type: 'testimony',
    day: 'Mon–Fri',
    duration: '1 hour',
  },
  {
    id: '7',
    title: 'Bragging on My Kids',
    time: '2:00 PM – 3:00 PM',
    host: 'Community Submission',
    description: 'Celebrate the joys of family and give thanks for loved ones doing amazing things.',
    type: 'family',
    day: 'Mon–Fri',
    duration: '1 hour',
  },
  {
    id: '8',
    title: '4-Point Connect to Heaven by Evan',
    time: '3:00 PM – 5:00 PM',
    host: 'Evan',
    description: 'A four-point biblical breakdown to elevate your connection with God.',
    type: 'faith',
    day: 'Mon–Fri',
    duration: '2 hours',
  },
  {
    id: '9',
    title: 'Sheffield Family Hour by Pastor George',
    time: '5:00 PM – 6:00 PM',
    host: 'Pastor George',
    description: 'Inspirational teaching and worship from the Sheffield Family Life Center.',
    type: 'worship',
    day: 'Mon–Fri',
    duration: '1 hour',
  },
  {
    id: '10',
    title: 'Youth Corner by Melissa Burt',
    time: '6:00 PM – 7:00 PM',
    host: 'Melissa Burt',
    description: 'Real talk, music, and testimonies tailored for the next generation of believers.',
    type: 'youth',
    day: 'Mon–Fri',
    duration: '1 hour',
  },
  {
    id: '11',
    title: "Let's Talk Money by Steve Richards",
    time: '7:00 PM – 8:00 PM',
    host: 'Steve Richards',
    description: 'Financial wisdom rooted in scripture. Build wealth, break debt, and steward well.',
    type: 'finance',
    day: 'Mon–Fri',
    duration: '1 hour',
  },
  {
    id: '12',
    title: 'My Spouse, My Heart by Jeff and Suzie Spencer',
    time: '8:00 PM – 9:00 PM',
    host: 'Jeff & Suzie Spencer',
    description: "Couples share their journey of love, trials, and triumph through God's design.",
    type: 'marriage',
    day: 'Mon–Fri',
    duration: '1 hour',
  },
  {
    id: '13',
    title: 'Meditation & Relaxation by Joyce Smith',
    time: '9:00 PM – 10:00 PM',
    host: 'Joyce Smith',
    description: 'Unwind with peaceful devotionals, scriptures, and guided meditations.',
    type: 'meditation',
    day: 'Mon–Fri',
    duration: '1 hour',
  },
  {
    id: '14',
    title: 'Praise & Worship Music',
    time: '10:00 PM – 12:00 AM',
    host: 'Auto-DJ',
    description: 'A soul-stirring mix of contemporary praise and deep worship.',
    type: 'music',
    day: 'Mon–Fri',
    duration: '2 hours',
  }
];

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let [_, hoursStr, minutesStr, ampm] = match;
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  ampm = ampm.toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function isShowActive(timeRange: string): boolean {
  const parts = timeRange.split(/–|-/);
  if (parts.length !== 2) return false;
  
  const startMins = parseTimeToMinutes(parts[0]);
  let endMins = parseTimeToMinutes(parts[1]);
  
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  
  if (endMins === 0) endMins = 24 * 60;
  if (endMins < startMins) {
    return currentMins >= startMins || currentMins < endMins;
  }
  
  return currentMins >= startMins && currentMins < endMins;
}

export function DailyScheduleScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000); // Update every 30s
    return () => clearInterval(timer);
  }, []);

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
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
        padding: 16,
        gap: 12,
        paddingBottom: 48,
      },
      introCard: {
        backgroundColor: theme.colors.primaryLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
      },
      introTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 4,
      },
      introText: {
        fontSize: 13,
        lineHeight: 18,
        color: theme.colors.textSecondary,
      },
      card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      },
      liveHighlight: {
        borderWidth: 2,
        borderColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
      },
      cardRow: {
        flexDirection: 'row',
        gap: 12,
      },
      iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
      },
      cardContent: {
        flex: 1,
        gap: 4,
      },
      timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      },
      timeText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.2,
      },
      dayBadge: {
        fontSize: 10,
        fontWeight: '600',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
      },
      titleText: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 20,
      },
      hostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      hostText: {
        fontSize: 12,
        fontWeight: '600',
      },
      descText: {
        fontSize: 13,
        lineHeight: 18,
        marginTop: 2,
      },
      durationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
      },
      durationText: {
        fontSize: 11,
        fontWeight: '600',
      },
      liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
      },
      liveBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
      },
      liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
      },
    });
  }, [theme]);

  const getIconConfig = (type: ScheduleItem['type']) => {
    switch (type) {
      case 'talk':
        return { name: 'chatbubbles-outline' as const, color: '#3b82f6', bg: '#eff6ff' };
      case 'marriage':
        return { name: 'heart-outline' as const, color: '#ec4899', bg: '#fdf2f8' };
      case 'testimony':
        return { name: 'mic-outline' as const, color: '#10b981', bg: '#ecfdf5' };
      case 'family':
        return { name: 'people-outline' as const, color: '#f59e0b', bg: '#fffbeb' };
      case 'faith':
        return { name: 'book-outline' as const, color: '#8b5cf6', bg: '#f5f3ff' };
      case 'worship':
        return { name: 'musical-notes-outline' as const, color: '#06b6d4', bg: '#ecfeff' };
      case 'youth':
        return { name: 'sparkles-outline' as const, color: '#f43f5e', bg: '#fff1f2' };
      case 'finance':
        return { name: 'wallet-outline' as const, color: '#10b981', bg: '#ecfdf5' };
      case 'meditation':
        return { name: 'leaf-outline' as const, color: '#14b8a6', bg: '#f0fdfa' };
      case 'music':
      default:
        return { name: 'radio-outline' as const, color: '#6366f1', bg: '#eef2ff' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <Pressable
            style={styles.backButton}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.goBack();
            }}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
          </Pressable>
        )}
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Daily Schedule</Text>
          <Text style={styles.headerSubtitle}>GKP Radio Broadcasts</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Program Schedule</Text>
          <Text style={styles.introText}>
            Join GKP Radio for inspiring programs throughout the week. Tap on any show to read its details. Currently airing shows are highlighted automatically.
          </Text>
        </View>

        {/* Schedule List */}
        {SCHEDULE_DATA.map((item) => {
          const active = isShowActive(item.time);
          const iconConfig = getIconConfig(item.type);
          
          return (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
                active && styles.liveHighlight,
              ]}
            >
              <View style={styles.cardRow}>
                {/* Left side: Icon */}
                <View style={[styles.iconWrapper, { backgroundColor: iconConfig.bg }]}>
                  <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
                </View>

                {/* Right side: Info */}
                <View style={styles.cardContent}>
                  {/* Time + Day */}
                  <View style={styles.timeRow}>
                    <Text style={[styles.timeText, { color: active ? theme.colors.primary : theme.colors.textSecondary }]}>
                      {item.time}
                    </Text>
                    {active ? (
                      <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveBadgeText}>ON AIR</Text>
                      </View>
                    ) : (
                      <Text style={[styles.dayBadge, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.textMuted }]}>
                        {item.day}
                      </Text>
                    )}
                  </View>

                  {/* Title */}
                  <Text style={[styles.titleText, { color: theme.colors.text }]}>
                    {item.title}
                  </Text>

                  {/* Host */}
                  <View style={styles.hostRow}>
                    <Ionicons name="person-outline" size={12} color={theme.colors.textMuted} />
                    <Text style={[styles.hostText, { color: theme.colors.textMuted }]}>
                      {item.host}
                    </Text>
                  </View>

                  {/* Description */}
                  <Text style={[styles.descText, { color: theme.colors.textSecondary }]}>
                    {item.description}
                  </Text>

                  {/* Duration */}
                  <View style={styles.durationRow}>
                    <Ionicons name="time-outline" size={12} color={theme.colors.textMuted} />
                    <Text style={[styles.durationText, { color: theme.colors.textMuted }]}>
                      Duration: {item.duration}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
