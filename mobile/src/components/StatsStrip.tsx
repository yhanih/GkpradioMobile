import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

interface StatsStripProps {
    familyMembers: number;
    prayersLifted: number;
    mediaItems: number;
    onPressPromotions?: () => void;
    onPressDonations?: () => void;
    onPressMerch?: () => void;
}

function formatCompactCount(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace('.0', '')}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
    return String(value);
}

type QuickLink = {
    label: string;
    onPress?: () => void;
};

function QuickLinkRow({ links }: { links: QuickLink[] }) {
    return (
        <View style={styles.linksRow}>
            {links.map((link, index) => (
                <React.Fragment key={link.label}>
                    {index > 0 ? <View style={styles.linkDivider} /> : null}
                    <Pressable
                        style={({ pressed }) => [
                            styles.linkButton,
                            pressed && styles.linkButtonPressed,
                        ]}
                        onPress={() => {
                            if (!link.onPress) return;
                            Haptics.selectionAsync();
                            link.onPress();
                        }}
                        disabled={!link.onPress}
                        accessibilityRole="button"
                        accessibilityLabel={link.label}
                    >
                        <Text style={styles.linkLabel}>{link.label}</Text>
                        <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.85)" />
                    </Pressable>
                </React.Fragment>
            ))}
        </View>
    );
}

export function StatsStrip({
    familyMembers,
    prayersLifted,
    mediaItems,
    onPressPromotions,
    onPressDonations,
    onPressMerch,
}: StatsStripProps) {
    const { theme, isDark } = useTheme();
    const gradientColors: [string, string] = isDark
        ? [theme.colors.primary, theme.colors.primaryLight]
        : ['#047857', '#065f46'];

    const quickLinks: QuickLink[] = [
        { label: 'Promotions', onPress: onPressPromotions },
        { label: 'Donations', onPress: onPressDonations },
        { label: 'Merch', onPress: onPressMerch },
    ];

    return (
        <View style={[styles.container, { shadowColor: theme.colors.primary }]}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{formatCompactCount(familyMembers)}</Text>
                        <Text style={styles.statLabel}>Family Members</Text>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{formatCompactCount(prayersLifted)}</Text>
                        <Text style={styles.statLabel}>Prayers Lifted</Text>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{formatCompactCount(mediaItems)}</Text>
                        <Text style={styles.statLabel}>Media Library</Text>
                    </View>
                </View>

                <View style={styles.linksDivider} />
                <QuickLinkRow links={quickLinks} />
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 16,
        shadowColor: '#047857',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
    },
    gradient: {
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    statItem: {
        alignItems: 'center',
        gap: 2,
        flex: 1,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    separator: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    linksDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginTop: 14,
        marginBottom: 10,
        marginHorizontal: 4,
    },
    linksRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    linkButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        paddingVertical: 6,
    },
    linkButtonPressed: {
        opacity: 0.85,
    },
    linkDivider: {
        width: 1,
        height: 18,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    linkLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.2,
    },
});
