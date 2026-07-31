/**
 * Image Preview Modal
 * Full-screen image viewer with gestures
 */

import React from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width, height } = Dimensions.get('window');

export default function ModalScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ imageUri?: string }>();

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Link href="/" dismissTo asChild>
          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.backgroundSecondary }]}>
            <IconSymbol name="xmark" size={22} color={colors.text} />
          </TouchableOpacity>
        </Link>
        <ThemedText type="defaultSemiBold">Önizleme</ThemedText>
        <View style={styles.placeholder} />
      </Animated.View>

      <Animated.View entering={ZoomIn.delay(100).duration(400)} style={styles.content}>
        {params.imageUri ? (
          <Image
            source={{ uri: params.imageUri }}
            style={styles.image}
            contentFit="contain"
          />
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
            <IconSymbol name="photo" size={64} color={colors.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              Görüntülenecek görsel yok
            </ThemedText>
            <Link href="/" dismissTo asChild>
              <TouchableOpacity style={[styles.homeBtn, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.homeBtnText}>Ana Sayfaya Dön</ThemedText>
              </TouchableOpacity>
            </Link>
          </View>
        )}
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: width - 40,
    height: height * 0.7,
    borderRadius: 20,
  },
  emptyState: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  homeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 8,
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
