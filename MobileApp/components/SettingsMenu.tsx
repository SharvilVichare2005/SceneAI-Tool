/**
 * Settings Menu Component
 * Slide-in overlay with theme toggle slider and language selector
 */

import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Pressable,
    Dimensions,
    Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolate,
    runOnJS,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MENU_WIDTH = Math.min(300, SCREEN_WIDTH * 0.8);

interface SettingsMenuProps {
    visible: boolean;
    onClose: () => void;
}

export function SettingsMenu({ visible, onClose }: SettingsMenuProps) {
    const { colorScheme, isDark, toggleTheme } = useTheme();
    const { language, toggleLanguage, t } = useLanguage();
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const slideAnim = useSharedValue(0);
    const backdropOpacity = useSharedValue(0);
    const sliderPosition = useSharedValue(isDark ? 1 : 0);

    useEffect(() => {
        if (visible) {
            slideAnim.value = withSpring(1, { damping: 20, stiffness: 150 });
            backdropOpacity.value = withTiming(1, { duration: 200 });
        } else {
            slideAnim.value = withSpring(0, { damping: 20, stiffness: 150 });
            backdropOpacity.value = withTiming(0, { duration: 200 });
        }
    }, [visible]);

    useEffect(() => {
        sliderPosition.value = withSpring(isDark ? 1 : 0, { damping: 15 });
    }, [isDark]);

    const menuStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(slideAnim.value, [0, 1], [MENU_WIDTH, 0]) },
        ],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
        pointerEvents: backdropOpacity.value > 0 ? 'auto' : 'none',
    }));

    const sliderKnobStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(sliderPosition.value, [0, 1], [0, 44]) },
        ],
    }));

    const handleThemeToggle = () => {
        toggleTheme();
    };

    if (!visible && slideAnim.value === 0) {
        return null;
    }

    return (
        <View style={styles.overlay}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable style={styles.backdropPressable} onPress={onClose} />
            </Animated.View>

            {/* Menu Panel */}
            <Animated.View
                style={[
                    styles.menuContainer,
                    {
                        backgroundColor: colors.background,
                        borderLeftColor: colors.border,
                        paddingTop: insets.top + 16,
                    },
                    menuStyle,
                ]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <ThemedText style={[styles.title, { color: colors.text }]}>
                        {t('settings')}
                    </ThemedText>
                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
                    >
                        <IconSymbol name="xmark" size={18} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Theme Section */}
                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="paintbrush.fill" size={20} color={colors.primary} />
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                            {t('theme')}
                        </ThemedText>
                    </View>

                    {/* Theme Slider */}
                    <View style={styles.sliderContainer}>
                        <IconSymbol
                            name="sun.max.fill"
                            size={22}
                            color={isDark ? colors.textSecondary : '#F59E0B'}
                        />
                        <TouchableOpacity
                            onPress={handleThemeToggle}
                            activeOpacity={0.8}
                            style={[
                                styles.slider,
                                {
                                    backgroundColor: isDark ? colors.primary : colors.backgroundSecondary,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.sliderKnob,
                                    {
                                        backgroundColor: isDark ? colors.background : '#FFFFFF',
                                        shadowColor: colors.shadow,
                                    },
                                    sliderKnobStyle,
                                ]}
                            />
                        </TouchableOpacity>
                        <IconSymbol
                            name="moon.fill"
                            size={20}
                            color={isDark ? '#FBBF24' : colors.textSecondary}
                        />
                    </View>

                    <ThemedText style={[styles.themeLabel, { color: colors.textSecondary }]}>
                        {isDark ? t('dark') : t('light')}
                    </ThemedText>
                </View>

                {/* Language Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="globe" size={20} color={colors.primary} />
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                            {t('language')}
                        </ThemedText>
                    </View>

                    <TouchableOpacity
                        onPress={toggleLanguage}
                        style={[
                            styles.languageButton,
                            {
                                backgroundColor: colors.primary,
                                shadowColor: colors.shadow,
                            },
                        ]}
                        activeOpacity={0.8}
                    >
                        <ThemedText style={styles.languageButtonText}>
                            {language === 'en' ? 'TR' : 'EN'}
                        </ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={[styles.languageHint, { color: colors.textSecondary }]}>
                        {language === 'en' ? 'Switch to Turkish' : 'İngilizce\'ye geç'}
                    </ThemedText>
                </View>

                {/* Source Code Section */}
                <TouchableOpacity
                    onPress={() => Linking.openURL('https://github.com/SharvilVichare2005/LabellingApp')}
                    style={[
                        styles.sourceCodeCard,
                        {
                            backgroundColor: colors.backgroundSecondary,
                            borderColor: colors.border,
                        },
                    ]}
                    activeOpacity={0.7}
                >
                    <View style={styles.sourceCodeContent}>
                        <View style={[styles.githubIconContainer, { backgroundColor: isDark ? '#FFFFFF' : '#24292e' }]}>
                            <ThemedText style={{ color: isDark ? '#24292e' : '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                                ⟠
                            </ThemedText>
                        </View>
                        <ThemedText style={[styles.sourceCodeText, { color: colors.text }]}>
                            {t('sourceCode')}
                        </ThemedText>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Developer Info Section */}
                <View style={[styles.developerCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <View style={styles.developerHeader}>
                        <IconSymbol name="person.fill" size={20} color={colors.primary} />
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                            {t('developerInfo')}
                        </ThemedText>
                    </View>
                    <ThemedText style={[styles.developerName, { color: colors.text }]}>
                       Team4
                    </ThemedText>
                    <View style={styles.developerButtons}>
                   
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdropPressable: {
        flex: 1,
    },
    menuContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: MENU_WIDTH,
        borderLeftWidth: 1,
        paddingHorizontal: 24,
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        paddingVertical: 24,
        borderBottomWidth: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    slider: {
        width: 80,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        padding: 4,
        justifyContent: 'center',
    },
    sliderKnob: {
        width: 28,
        height: 28,
        borderRadius: 14,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    themeLabel: {
        textAlign: 'center',
        marginTop: 12,
        fontSize: 13,
    },
    languageButton: {
        alignSelf: 'center',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    languageButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 1,
    },
    languageHint: {
        textAlign: 'center',
        marginTop: 12,
        fontSize: 13,
    },
    sourceCodeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 24,
    },
    sourceCodeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    githubIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sourceCodeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    developerCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 16,
        marginBottom: 24,
    },
    developerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    developerName: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
    },
    developerButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    developerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    developerButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
