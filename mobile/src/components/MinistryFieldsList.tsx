import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COMMUNITY_CATEGORIES, Category } from '../constants/categories';
import { useTheme } from '../contexts/ThemeContext';
import { AnimatedCount } from './AnimatedCount';

interface MinistryFieldsListProps {
  onPressItem: (category: Category) => void;
}

interface Group {
  title: string;
  items: Category[];
}

export function MinistryFieldsList({ onPressItem }: MinistryFieldsListProps) {
  const { theme } = useTheme();
  
  // Static counts for frontend-only demonstration
  const counts: { [key: string]: number } = {
    all: 156,
    'Prayer Requests': 42,
    'Pray for Others': 28,
    'Testimonies': 18,
    'Praise & Worship': 12,
    'Words of Encouragement': 34,
    'Born Again': 7,
    'Youth Voices': 15,
    'Sharing Hobbies': 24,
    'Physical & Mental Health': 19,
    'Money & Finances': 11,
    'To My Wife': 8,
    'To My Husband': 6,
    'Bragging on My Child (ren)': 14,
  };

  const loading = false;

  const groups: Group[] = [
    {
      title: 'Faith & Community',
      items: COMMUNITY_CATEGORIES.filter(cat => 
        ['all', 'Prayer Requests', 'Pray for Others', 'Testimonies', 'Praise & Worship', 'Words of Encouragement', 'Born Again', 'Youth Voices'].includes(cat.id)
      ).sort((a, b) => {
        const order = ['all', 'Prayer Requests', 'Pray for Others', 'Testimonies', 'Praise & Worship', 'Words of Encouragement', 'Born Again', 'Youth Voices'];
        return order.indexOf(a.id) - order.indexOf(b.id);
      })
    },
    {
      title: 'Life & Interests',
      items: COMMUNITY_CATEGORIES.filter(cat => 
        ['Sharing Hobbies', 'Physical & Mental Health', 'Money & Finances'].includes(cat.id)
      )
    },
    {
      title: 'Family',
      items: COMMUNITY_CATEGORIES.filter(cat => 
        ['To My Wife', 'To My Husband', 'Bragging on My Child (ren)'].includes(cat.id)
      )
    }
  ];

  const handlePress = (category: Category) => {
    Haptics.selectionAsync();
    onPressItem(category);
  };

  const getIconColor = (id: string): string => {
    switch (id) {
      case 'all': return '#007AFF'; // iOS Blue
      case 'Prayer Requests': return '#FF3B30'; // iOS Red
      case 'Pray for Others': return '#5856D6'; // iOS Purple
      case 'Testimonies': return '#FFCC00'; // iOS Gold
      case 'Praise & Worship': return '#34C759'; // iOS Green
      case 'Words of Encouragement': return '#FF2D55'; // iOS Pink
      case 'Born Again': return '#AF52DE'; // iOS Violet
      case 'Youth Voices': return '#5AC8FA'; // iOS Sky Blue
      case 'Sharing Hobbies': return '#FF9500'; // iOS Orange
      case 'Physical & Mental Health': return '#00C7BE'; // iOS Teal
      case 'Money & Finances': return '#A2845E'; // iOS Brown
      case 'To My Wife': return '#FF2D55';
      case 'To My Husband': return '#007AFF';
      case 'Bragging on My Child (ren)': return '#FFCC00';
      default: return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Ministry Fields</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Share Stories, Request Prayers & Grow Together
        </Text>
      </View>

      {groups.map((group, groupIndex) => (
        <View key={group.title} style={styles.groupContainer}>
          <Text style={[styles.groupTitle, { color: theme.colors.textMuted }]}>
            {group.title.toUpperCase()}
          </Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            {group.items.map((item, index) => (
              <React.Fragment key={item.id}>
                <Pressable
                  style={({ pressed }) => [
                    styles.item,
                    { backgroundColor: pressed ? theme.colors.surfaceSecondary : 'transparent' }
                  ]}
                  onPress={() => handlePress(item)}
                >
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.id) + '15' }]}>
                      <Ionicons 
                        name={item.icon} 
                        size={22} 
                        color={getIconColor(item.id)} 
                      />
                    </View>
                    <Text style={[styles.itemLabel, { color: theme.colors.text }]}>
                      {item.label}
                    </Text>
                  </View>
                  
                  <View style={styles.itemRight}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#C4C4C6" />
                    ) : (
                      <AnimatedCount 
                        target={counts[item.id] || 0} 
                        style={styles.countText}
                      />
                    )}
                    <Ionicons name="chevron-forward" size={18} color="#C4C4C6" style={styles.chevron} />
                  </View>
                </Pressable>
                {index < group.items.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.colors.border, marginLeft: 56 }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  groupContainer: {
    marginTop: 16,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 36,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 54,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '400',
  },
  countText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  chevron: {
    marginLeft: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  }
});
