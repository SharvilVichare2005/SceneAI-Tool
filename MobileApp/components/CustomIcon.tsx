/**
 * Custom Icon Component
 * Renders custom PNG icons from assets folder
 * Supports tintColor for theming
 */

import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

// Icon assets mapping
const iconAssets = {
    gallery: require('@/assets/icons/gallery.png'),
    camera: require('@/assets/icons/camera.png'),
    video: require('@/assets/icons/video.png'),
    photo: require('@/assets/icons/photo.png'),
    back: require('@/assets/icons/back.png'),
    'camera-rotate': require('@/assets/icons/camera-rotate.png'),
} as const;

export type CustomIconName = keyof typeof iconAssets;

interface CustomIconProps {
    name: CustomIconName;
    size?: number;
    color?: string;
    style?: StyleProp<ImageStyle>;
}

export function CustomIcon({ name, size = 24, color, style }: CustomIconProps) {
    return (
        <Image
            source={iconAssets[name]}
            style={[
                {
                    width: size,
                    height: size,
                    tintColor: color,
                },
                style,
            ]}
            resizeMode="contain"
        />
    );
}
