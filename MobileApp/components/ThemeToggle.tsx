/**
 * Theme Toggle Component
 * Animated button to switch between dark and light modes
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Animated, {
    useAnimatedStyle,
    withSpring,
    interpolate,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ThemeToggle() {
    const { isDark, toggleTheme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const rotation = useSharedValue(isDark ? 1 : 0);

    React.useEffect(() => {
        rotation.value = withSpring(isDark ? 1 : 0, {
            damping: 15,
            stiffness: 100,
        });
    }, [isDark, rotation]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` },
                { scale: interpolate(rotation.value, [0, 0.5, 1], [1, 0.8, 1]) },
            ],
        };
    });

    const handlePress = () => {
        toggleTheme();
    };

    return (
        <AnimatedPressable
            onPress={handlePress}
            style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                },
                animatedStyle,
            ]}
        >
            <IconSymbol
                name={isDark ? 'moon.fill' : 'sun.max.fill'}
                size={24}
                color={isDark ? '#FBBF24' : '#F59E0B'}
            />
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});
