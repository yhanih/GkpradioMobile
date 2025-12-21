import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface MinistryItem {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

interface MinistryRailProps {
    onPressItem: (item: MinistryItem) => void;
}

const MINISTRIES: MinistryItem[] = [
    {
        id: 'prayer',
        title: 'Prayer Requests',
        description: 'Join us in prayer',
        icon: 'heart-outline',
        color: '#ef4444', // Red
    },
    {
        id: 'testimony',
        title: 'Testimonies',
        description: "Share God's work",
        icon: 'sparkles-outline',
        color: '#f59e0b', // Amber/Gold
    },
    {
        id: 'youth',
        title: 'Youth Voices',
        description: 'Faith in college',
        icon: 'school-outline',
        color: '#3b82f6', // Blue
    },
];

export function MinistryRail({ onPressItem }: MinistryRailProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Ministry Fields</Text>
                <Text style={styles.subtitle}>Share Stories, Request Prayers & Grow Together</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {MINISTRIES.map((item) => (
                    <Pressable
                        key={item.id}
                        style={styles.card}
                        onPress={() => {
                            Haptics.selectionAsync();
                            onPressItem(item);
                        }}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                            <Ionicons name={item.icon} size={24} color={item.color} />
                        </View>

                        <View style={styles.textContainer}>
                            <View style={styles.badgeRow}>
                                <Text style={[styles.tag, { color: item.color, borderColor: item.color + '30' }]}>
                                    Discussion
                                </Text>
                                {item.id === 'prayer' && <View style={styles.hotBadge}><Text style={styles.hotText}>Hot</Text></View>}
                            </View>

                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardDescription}>{item.description}</Text>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.joinText}>Join Discussion</Text>
                            <Ionicons name="chatbubbles-outline" size={14} color="#71717a" />
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#09090b',
        fontFamily: 'System', // Serif if available?
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#71717a',
        lineHeight: 18,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    card: {
        width: 260,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f4f4f5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    textContainer: {
        marginBottom: 16,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    tag: {
        fontSize: 10,
        fontWeight: '600',
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        textTransform: 'uppercase',
    },
    hotBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    hotText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#09090b',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#52525b',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f4f4f5',
        paddingTop: 12,
    },
    joinText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#09090b',
    }
});
