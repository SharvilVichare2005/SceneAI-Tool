/**
 * ModeSelector Component
 * Tab selector for 5 AI analysis modes
 */

import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export type AnalysisMode = 'caption' | 'query' | 'detect' | 'point' | 'segment';

interface ModeSelectorProps {
    selectedMode: AnalysisMode;
    onModeChange: (mode: AnalysisMode) => void;
    disabled?: boolean;
}

interface ModeConfig {
    key: AnalysisMode;
    icon: string;
    labelKey: string;
}

const modes: ModeConfig[] = [
    { key: 'caption', icon: 'text.alignleft', labelKey: 'modeCaption' },
    { key: 'query', icon: 'questionmark.circle', labelKey: 'modeQuery' },
    { key: 'detect', icon: 'square.dashed', labelKey: 'modeDetect' },
    { key: 'point', icon: 'mappin', labelKey: 'modePoint' },
    { key: 'segment', icon: 'scissors', labelKey: 'modeSegment' },
];

export function ModeSelector({ selectedMode, onModeChange, disabled = false }: ModeSelectorProps) {
    const { colorScheme } = useTheme();
    const { t } = useLanguage();
    const colors = Colors[colorScheme];

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {modes.map((mode) => {
                    const isSelected = selectedMode === mode.key;
                    return (
                        <TouchableOpacity
                            key={mode.key}
                            style={[
                                styles.modeButton,
                                {
                                    backgroundColor: isSelected ? colors.primary : colors.card,
                                    borderColor: isSelected ? colors.primary : colors.border,
                                },
                            ]}
                            onPress={() => onModeChange(mode.key)}
                            disabled={disabled}
                            activeOpacity={0.7}
                        >
                            <IconSymbol
                                name={mode.icon as any}
                                size={18}
                                color={isSelected ? '#FFFFFF' : colors.textSecondary}
                            />
                            <ThemedText
                                style={[
                                    styles.modeLabel,
                                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                                ]}
                            >
                                {t(mode.labelKey as any)}
                            </ThemedText>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 10,
    },
    modeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    modeLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
});

export default ModeSelector;
