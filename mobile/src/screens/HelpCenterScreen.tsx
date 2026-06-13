import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { HELP_DESK_EMAIL } from '../constants/contact';
import * as Haptics from 'expo-haptics';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    title: 'General & Radio',
    icon: 'radio-outline',
    items: [
      {
        question: 'What is GKP Radio?',
        answer: 'God Kingdom Principles Radio (GKP Radio) is a faith-based digital ministry broadcasting Christian teachings, sermons, music, and prayer sessions globally, 24/7.',
      },
      {
        question: 'Can I listen to programs offline?',
        answer: 'You can stream our live radio station and play podcasts/videos online. While live radio requires internet access, we are currently working on offline downloading for selected podcast episodes.',
      },
      {
        question: 'How much data does live streaming use?',
        answer: 'Streaming audio uses approximately 60MB of data per hour. We recommend connecting to Wi-Fi whenever possible to avoid high mobile data usage.',
      },
    ],
  },
  {
    title: 'Community & Safety',
    icon: 'people-outline',
    items: [
      {
        question: 'What are the rules for posting in the Community?',
        answer: 'The GKP Community is a Christ-centered space for uplifting testimonies, prayers, and encouragement. We enforce a zero-tolerance policy against hate speech, harassment, vulgarity, and solicitation.',
      },
      {
        question: 'How do I block an abusive user?',
        answer: "To block a user, tap the ⋯ (more options) button on any of their posts or directly on their profile, and select 'Block User'. Their content will be instantly hidden from your feeds.",
      },
      {
        question: 'How do I report objectionable content?',
        answer: "You can report any post, comment, or chat message by tapping ⋯ and selecting 'Report'. Our moderation team reviews all reports within 24 hours.",
      },
    ],
  },
  {
    title: 'Store & Giving',
    icon: 'heart-outline',
    items: [
      {
        question: 'Is my donation secure?',
        answer: 'Yes. All donations are securely processed via our official website gateway. The app redirects you safely to complete the transaction.',
      },
      {
        question: 'How long does shipping take for Store orders?',
        answer: 'Physical merchandise orders are processed within 2-3 business days. Domestic shipping generally takes 3-7 business days depending on location.',
      },
    ],
  },
  {
    title: 'Account Settings',
    icon: 'person-outline',
    items: [
      {
        question: 'How do I change my profile avatar?',
        answer: "Go to the Profile tab, tap 'Edit' in the top right, pick a new avatar style/seed, and tap 'Save Changes' at the bottom of the card.",
      },
      {
        question: 'How do I delete my account?',
        answer: `Under Profile -> Settings, tap 'Delete Account'. It will launch a pre-filled support email request. You can also email ${HELP_DESK_EMAIL} directly to request account deletion.`,
      },
    ],
  },
];

export function HelpCenterScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Track expanded questions by categoryIndex-itemIndex string
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const toggleExpand = (catIndex: number, itemIndex: number) => {
    Haptics.selectionAsync();
    const key = `${catIndex}-${itemIndex}`;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedIndex === key) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(key);
    }
  };

  const handleContactEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `mailto:${HELP_DESK_EMAIL}?subject=${encodeURIComponent('GKP Help Desk Request')}`;
    Linking.openURL(url).catch(() => {
      alert(`Could not launch mail client. Please contact ${HELP_DESK_EMAIL} directly.`);
    });
  };

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
          <Text style={styles.headerTitle}>Help Center</Text>
          <Text style={styles.headerSubtitle}>FAQs & App Support</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.introText}>
          Find answers to common questions about using GKP Radio, managing your profile, or contributing to the ministry.
        </Text>

        {FAQ_DATA.map((category, catIndex) => (
          <View key={category.title} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIconWrap, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name={category.icon} size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
                {category.title}
              </Text>
            </View>

            <View style={[styles.faqCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              {category.items.map((item, itemIndex) => {
                const key = `${catIndex}-${itemIndex}`;
                const isExpanded = expandedIndex === key;
                const isLastItem = itemIndex === category.items.length - 1;

                return (
                  <View key={item.question}>
                    <Pressable
                      style={styles.accordionHeader}
                      onPress={() => toggleExpand(catIndex, itemIndex)}
                    >
                      <Text style={[styles.questionText, { color: theme.colors.text }]}>
                        {item.question}
                      </Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>

                    {isExpanded && (
                      <View style={styles.accordionContent}>
                        <Text style={[styles.answerText, { color: theme.colors.textSecondary }]}>
                          {item.answer}
                        </Text>
                      </View>
                    )}

                    {!isLastItem && (
                      <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Support Card */}
        <View style={[styles.supportCard, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
          <Ionicons name="chatbox-ellipses-outline" size={28} color={theme.colors.primary} style={styles.supportIcon} />
          <Text style={[styles.supportTitle, { color: theme.colors.text }]}>
            Still need assistance?
          </Text>
          <Text style={[styles.supportDesc, { color: theme.colors.textSecondary }]}>
            Our ministry support staff is here to help. Drop us an email and we will respond as soon as possible.
          </Text>
          <Pressable
            style={[styles.supportButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleContactEmail}
          >
            <Ionicons name="mail" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.supportButtonText}>Email Support</Text>
          </Pressable>
          <Text style={[styles.supportMailText, { color: theme.colors.textMuted }]}>
            {HELP_DESK_EMAIL}
          </Text>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
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
    introText: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      marginBottom: 24,
    },
    categorySection: {
      marginBottom: 24,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    categoryIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryTitle: {
      fontSize: 15,
      fontWeight: '700',
    },
    faqCard: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    accordionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    questionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
    accordionContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 4,
    },
    answerText: {
      fontSize: 13,
      lineHeight: 19,
    },
    divider: {
      height: 1,
      marginHorizontal: 16,
    },
    supportCard: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 24,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    supportIcon: {
      marginBottom: 12,
    },
    supportTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 6,
    },
    supportDesc: {
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 10,
    },
    supportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 28,
      borderRadius: 12,
      marginBottom: 10,
    },
    supportButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    supportMailText: {
      fontSize: 12,
      fontWeight: '600',
    },
  });
}
