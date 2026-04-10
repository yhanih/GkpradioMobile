import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StatsStripProps {
    familyMembers: number;
    prayersLifted: number;
    mediaItems: number;
}

function formatCompactCount(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace('.0', '')}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
    return String(value);
}

export function StatsStrip({ familyMembers, prayersLifted, mediaItems }: StatsStripProps) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#047857', '#065f46']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    statItem: {
        alignItems: 'center',
        gap: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800', // Heavy bold for numbers
        color: '#fff',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    separator: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
});
