import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { OptimisticImage } from './OptimisticImage';

interface MediaItem {
    id: string;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    duration?: string;
}

interface MediaRailProps {
    title: string;
    items: MediaItem[];
    type: 'podcast' | 'video';
    onPressItem: (item: MediaItem) => void;
    onPressViewAll: () => void;
}

export function MediaRail({ title, items, type, onPressItem, onPressViewAll }: MediaRailProps) {

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Pressable
                    onPress={() => {
                        Haptics.selectionAsync();
                        onPressViewAll();
                    }}
                    hitSlop={20}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
                >
                    <Text style={styles.viewAll}>See All</Text>
                </Pressable>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={type === 'podcast' ? 160 : 220} // Width + gap
            >
                {items.map((item) => (
                    <Pressable
                        key={item.id}
                        style={[styles.card, type === 'video' && styles.videoCard]}
                        onPress={() => {
                            Haptics.selectionAsync();
                            onPressItem(item);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${type === 'video' ? 'Watch' : 'Listen to'} ${item.title}`}
                        accessibilityHint={`${type === 'video' ? 'Plays' : 'Plays'} ${item.title}`}
                    >
                        <View style={[styles.imageContainer, type === 'video' && styles.videoImageContainer]}>
                            <OptimisticImage
                                source={{ uri: item.imageUrl || '' }}
                                style={styles.image}
                                resizeMode="cover"
                                fallbackIcon={type === 'video' ? 'videocam-outline' : 'musical-notes-outline'}
                            />
                            {/* Play Overlay */}
                            <View style={styles.playOverlay}>
                                <Ionicons name={type === 'video' ? 'play' : 'play-circle'} size={type === 'video' ? 24 : 32} color="#fff" />
                            </View>

                            {item.duration && (
                                <View style={styles.durationBadge}>
                                    <Text style={styles.durationText}>{item.duration}</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.cardTitle} numberOfLines={2}>
                            {item.title}
                        </Text>
                        {item.subtitle && (
                            <Text style={styles.cardSubtitle} numberOfLines={1}>
                                {item.subtitle}
                            </Text>
                        )}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#09090b',
    },
    viewAll: {
        fontSize: 14,
        fontWeight: '600',
        color: '#047857',
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    card: {
        width: 144,
    },
    videoCard: {
        width: 204,
    },
    imageContainer: {
        width: 144,
        height: 144,
        borderRadius: 12,
        backgroundColor: '#f4f4f5',
        marginBottom: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    videoImageContainer: {
        width: 204,
        height: 115, // 16:9 approx
    },
    image: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        display: 'none', // Hide by default, maybe show on a larger card design or just rely on image
    },
    durationBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#09090b',
        marginBottom: 2,
        lineHeight: 18,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#71717a',
        fontWeight: '500',
    },
});
