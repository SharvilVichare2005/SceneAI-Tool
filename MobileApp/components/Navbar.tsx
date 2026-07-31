/**
 * Navbar Component
 * Top navigation bar with branding (home link), and hamburger menu
 */

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import Animated, {
    FadeInLeft,
    FadeInRight,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SettingsMenu } from '@/components/SettingsMenu';

interface NavbarProps {
    showHomeButton?: boolean;
}

export function Navbar({ showHomeButton = true }: NavbarProps) {
    const { colorScheme } = useTheme();
    const { t } = useLanguage();
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const [menuVisible, setMenuVisible] = useState(false);

    const isHome = pathname === '/' || pathname === '/index';

    const handleBrandPress = () => {
        if (!isHome) {
            router.push('/');
        }
    };

    const handleMenuPress = () => {
        setMenuVisible(true);
    };

    const handleMenuClose = () => {
        setMenuVisible(false);
    };

    return (
        <>
            <View
                style={[
                    styles.container,
                    {
                        paddingTop: insets.top + 8,
                        backgroundColor: colors.background,
                        borderBottomColor: colors.border,
                    },
                ]}
            >
                {/* Left Section - Branding (acts as home button) */}
                <TouchableOpacity
                    onPress={handleBrandPress}
                    activeOpacity={isHome ? 1 : 0.7}
                    disabled={isHome}
                >
                    <Animated.View entering={FadeInLeft.delay(100).duration(500)} style={styles.brandingSection}>
                        <ThemedText style={[styles.appTitle, { color: colors.text }]}>
                            {t('appTitle')}
                        </ThemedText>
                        <ThemedText style={[styles.developerText, { color: colors.textSecondary }]}>
                            {t('developer')}
                        </ThemedText>
                    </Animated.View>
                </TouchableOpacity>

                {/* Right Section - Hamburger Menu */}
                <Animated.View entering={FadeInRight.delay(200).duration(500)} style={styles.controlsSection}>
                    <TouchableOpacity
                        onPress={handleMenuPress}
                        style={[
                            styles.menuButton,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                        activeOpacity={0.7}
                    >
                        <View style={styles.hamburgerIcon}>
                            <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
                            <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
                            <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Settings Menu Overlay */}
            <SettingsMenu visible={menuVisible} onClose={handleMenuClose} />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    brandingSection: {
        flex: 1,
    },
    appTitle: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    developerText: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
        opacity: 0.8,
    },
    controlsSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    hamburgerIcon: {
        width: 20,
        height: 14,
        justifyContent: 'space-between',
    },
    hamburgerLine: {
        width: 20,
        height: 2,
        borderRadius: 1,
    },
});
