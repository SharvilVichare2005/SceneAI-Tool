/**
 * BoundingBoxOverlay Component
 * Renders bounding boxes over an image for object detection results
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import type { Region } from '@/services/moondreamApi';

interface BoundingBoxOverlayProps {
    boxes: Region[];
    imageWidth: number;
    imageHeight: number;
    imageLayout: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    objectName?: string;
}

// Color palette for multiple bounding boxes
const BOX_COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Gold
];

export function BoundingBoxOverlay({
    boxes,
    imageWidth,
    imageHeight,
    imageLayout,
    objectName,
}: BoundingBoxOverlayProps) {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    if (boxes.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, { width: imageWidth, height: imageHeight }]}>
            {boxes.map((box, index) => {
                // Convert normalized coordinates (0-1) to pixel coordinates using imageLayout
                const left = imageLayout.x + box.x_min * imageLayout.width;
                const top = imageLayout.y + box.y_min * imageLayout.height;
                const width = (box.x_max - box.x_min) * imageLayout.width;
                const height = (box.y_max - box.y_min) * imageLayout.height;
                const boxColor = BOX_COLORS[index % BOX_COLORS.length];

                return (
                    <Animated.View
                        key={`box-${index}`}
                        entering={FadeIn.delay(index * 100).duration(300)}
                        style={[
                            styles.boundingBox,
                            {
                                left,
                                top,
                                width,
                                height,
                                borderColor: boxColor,
                            },
                        ]}
                    >
                        {/* Label */}
                        <View style={[styles.label, { backgroundColor: boxColor }]}>
                            <ThemedText style={styles.labelText}>
                                {objectName ? `${objectName} ${index + 1}` : `#${index + 1}`}
                            </ThemedText>
                        </View>
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
    boundingBox: {
        position: 'absolute',
        borderWidth: 2,
        borderRadius: 4,
        borderStyle: 'solid',
    },
    label: {
        position: 'absolute',
        top: -22,
        left: -2,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    labelText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
});

export default BoundingBoxOverlay;
