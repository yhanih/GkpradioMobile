import React from 'react';
import { View, Text, StyleSheet, Pressable, ImageBackground, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { ScheduleCarousel } from './ScheduleCarousel';
import { Schedule } from '../types/database.types';

interface HeroPlayerCardProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    currentShowTitle?: string;
    currentShowHost?: string;
    schedule?: Schedule[];
    onPress: () => void;
}

const { width } = Dimensions.get('window');

export function HeroPlayerCard({
    isPlaying,
    onTogglePlay,
    currentShowTitle = "Kingdom Principles Live",
    currentShowHost = "GKP Radio",
    schedule = [],
    onPress
}: HeroPlayerCardProps) {

    const opacity = React.useRef(new Animated.Value(0.4)).current;

    React.useEffect(() => {
        if (isPlaying) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0.4,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            opacity.setValue(0.6); // Static when not playing
        }
    }, [isPlaying]);

    return (
        <Pressable style={styles.container} onPress={onPress}>
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=800&q=80' }}
                style={styles.backgroundImage}
                imageStyle={{ borderRadius: 24 }}
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                >
                    {/* Header Badge */}
                    <View style={styles.headerRow}>
                        <View style={styles.liveBadge}>
                            <Animated.View style={[styles.liveDot, { opacity }]} />
                            <Text style={styles.liveText}>ON AIR</Text>
                        </View>
                        <View style={styles.listenersContainer}>
                            <Ionicons name="headset" size={12} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.listenerText}>Live Stream</Text>
                        </View>
                    </View>

                    {/* Main Content */}
                    <View style={styles.contentContainer}>
                        <View style={styles.textContainer}>
                            {schedule && schedule.length > 0 ? (
                                <View style={{ height: 80, justifyContent: 'center' }}>
                                    <Text style={styles.showHost}>COMING UP</Text>
                                    <ScheduleCarousel schedule={schedule} />
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.showHost}>{currentShowHost}</Text>
                                    <Text style={styles.showTitle} numberOfLines={2}>
                                        {currentShowTitle}
                                    </Text>
                                </>
                            )}
                        </View>

                        <Pressable
                            style={styles.playButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onTogglePlay();
                            }}
                        >
                            {isPlaying ? (
                                <Ionicons name="pause" size={32} color="#047857" style={{ marginLeft: 2 }} />
                            ) : (
                                <Ionicons name="play" size={32} color="#047857" style={{ marginLeft: 4 }} />
                            )}
                        </Pressable>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width - 32,
        height: 220,
        marginHorizontal: 16,
        borderRadius: 24,
        shadowColor: '#047857',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
        marginBottom: 32,
    },
    backgroundImage: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.9)', // Red
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 100,
        gap: 6,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
    },
    liveText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    listenersContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 100,
    },
    listenerText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontWeight: '500',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
        marginRight: 16,
    },
    showHost: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    showTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 28,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
});
