import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function StatsStrip() {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#047857', '#065f46']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>2,500+</Text>
                    <Text style={styles.statLabel}>Family Members</Text>
                </View>

                <View style={styles.separator} />

                <View style={styles.statItem}>
                    <Text style={styles.statValue}>45K+</Text>
                    <Text style={styles.statLabel}>Prayers Lifted</Text>
                </View>

                <View style={styles.separator} />

                <View style={styles.statItem}>
                    <Text style={styles.statValue}>24/7</Text>
                    <Text style={styles.statLabel}>Live Ministry</Text>
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
