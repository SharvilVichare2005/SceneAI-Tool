/**
 * PointMarkerOverlay Component
 * Renders point markers over an image for point detection results
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import type { Point } from '@/services/moondreamApi';

interface PointMarkerOverlayProps {
    points: Point[];
    imageWidth: number;
    imageHeight: number;
    imageLayout: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

// Color palette for point markers
const POINT_COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Gold
];

const MARKER_SIZE = 28;

export function PointMarkerOverlay({
    points,
    imageWidth,
    imageHeight,
    imageLayout,
}: PointMarkerOverlayProps) {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    if (points.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, { width: imageWidth, height: imageHeight }]}>
            {points.map((point, index) => {
                // Convert normalized coordinates (0-1) to pixel coordinates using imageLayout
                const left = imageLayout.x + point.x * imageLayout.width - MARKER_SIZE / 2;
                const top = imageLayout.y + point.y * imageLayout.height - MARKER_SIZE / 2;
                const markerColor = POINT_COLORS[index % POINT_COLORS.length];

                return (
                    <Animated.View
                        key={`point-${index}`}
                        entering={ZoomIn.delay(index * 100).duration(300)}
                        style={[
                            styles.marker,
                            {
                                left,
                                top,
                                backgroundColor: markerColor,
                            },
                        ]}
                    >
                        <ThemedText style={styles.markerText}>{index + 1}</ThemedText>
                        {/* Pulse ring effect */}
                        <View style={[styles.pulseRing, { borderColor: markerColor }]} />
                    </Animated.View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    marker: {
        position: 'absolute',
        width: MARKER_SIZE,
        height: MARKER_SIZE,
        borderRadius: MARKER_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    markerText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    pulseRing: {
        position: 'absolute',
        width: MARKER_SIZE + 12,
        height: MARKER_SIZE + 12,
        borderRadius: (MARKER_SIZE + 12) / 2,
        borderWidth: 2,
        opacity: 0.5,
    },
});

export default PointMarkerOverlay;
