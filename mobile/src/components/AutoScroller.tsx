import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Easing, LayoutChangeEvent } from 'react-native';
import { Schedule } from '../types/database.types';

interface AutoScrollerProps {
    schedule: Schedule[];
}

export const AutoScroller: React.FC<AutoScrollerProps> = ({ schedule }) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
    const translateX = useRef(new Animated.Value(0)).current;

    // Format the schedule items into a single string
    // If no items, fallback is handled by parent, but we can have a safe default here
    const textContent = schedule.length > 0
        ? schedule.map(item => `${item.show_title} (${item.start_time.slice(0, 5)} - ${item.end_time.slice(0, 5)})`).join('  •  ')
        : 'Praise & Worship Music';

    // We duplicate the content to ensure smooth seamless scrolling
    // If the content is short, we might need more duplication, but for now 2x is a good start for seamless loop
    const contentToRender = [textContent, textContent].join('  •  ');

    useEffect(() => {
        if (contentWidth > containerWidth && containerWidth > 0) {
            startScrolling();
        }
    }, [contentWidth, containerWidth]);

    const startScrolling = () => {
        translateX.setValue(0);

        // Calculate duration based on width to maintain consistent speed
        // Speed = pixels / ms
        // We want a speed of roughly 30-50 pixels per second for readability
        const speed = 40;
        const duration = (contentWidth / 2) / speed * 1000; // time to scroll one instance of the content

        Animated.loop(
            Animated.timing(translateX, {
                toValue: -(contentWidth / 2) - 20, // Scroll half the width (plus spacing)
                duration: duration,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    };

    const handleLayout = (e: LayoutChangeEvent) => {
        // We only care about the single text width, but since we render duplicate,
        // we can just measure the container or estimate.
        // Better approach: Measure the Text component itself.
    };

    return (
        <View
            style={styles.container}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
            <View style={styles.mask}>
                <Animated.View
                    style={[
                        styles.scrollingContainer,
                        { transform: [{ translateX }] }
                    ]}
                >
                    <Text
                        style={styles.text}
                        onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
                        numberOfLines={1}
                    >
                        {contentToRender}
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: 30, // Fixed height for the scroller area
        justifyContent: 'center',
        overflow: 'hidden',
    },
    mask: {
        flex: 1,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    scrollingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    text: {
        color: '#fff',
        fontSize: 24, // Matches HeroPlayerCard title size
        fontWeight: '700',
        lineHeight: 28,
    },
});
