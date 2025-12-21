import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { Schedule } from '../types/database.types';

interface ScheduleCarouselProps {
    schedule: Schedule[];
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 120; // Account for padding and play button
const TRANSITION_DURATION = 500; // ms for slide animation
const DISPLAY_DURATION = 4000; // ms to show each card

export const ScheduleCarousel: React.FC<ScheduleCarouselProps> = ({ schedule }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (schedule.length <= 1) return;

        const interval = setInterval(() => {
            // Fade out
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                // Update index
                setCurrentIndex((prevIndex) => (prevIndex + 1) % schedule.length);

                // Fade in
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }, DISPLAY_DURATION);

        return () => clearInterval(interval);
    }, [schedule.length]);

    if (schedule.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.fallbackText}>Praise & Worship Music</Text>
            </View>
        );
    }

    const currentShow = schedule[currentIndex];

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.cardContainer, { opacity }]}>
                <Text style={styles.showTitle} numberOfLines={1}>
                    {currentShow.show_title}
                </Text>
                <Text style={styles.showTime}>
                    {currentShow.start_time?.slice(0, 5)} - {currentShow.end_time?.slice(0, 5)}
                    {currentShow.hosts && ` • ${currentShow.hosts}`}
                </Text>
            </Animated.View>

            {/* Indicator Dots */}
            {schedule.length > 1 && (
                <View style={styles.indicatorContainer}>
                    {schedule.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                index === currentIndex && styles.indicatorActive
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    cardContainer: {
        justifyContent: 'center',
    },
    showTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 28,
        marginBottom: 4,
    },
    showTime: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: '500',
    },
    fallbackText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
    },
    indicatorContainer: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 12,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    indicatorActive: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        width: 20,
    },
});
