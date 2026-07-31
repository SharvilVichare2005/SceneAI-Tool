/**
 * Settings/Explore Screen - Placeholder
 * This screen is hidden from tabs but kept for routing
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemeToggle } from '@/components/ThemeToggle';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ExploreScreen() {
  const { colorScheme } = useTheme();
  const { t } = useLanguage();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="title">{t('settingsTitle')}</ThemedText>
        <ThemeToggle />
      </View>

      <View style={styles.content}>
        <View style={[styles.placeholder, { backgroundColor: colors.backgroundSecondary }]}>
          <IconSymbol name="gear" size={48} color={colors.textSecondary} />
          <ThemedText style={[styles.placeholderText, { color: colors.textSecondary }]}>
            {t('settingsComingSoon')}
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholder: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
