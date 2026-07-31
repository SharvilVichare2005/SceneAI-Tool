/**
 * Labelling App - Home Screen
 * Modern home page with Photo and Video selection cards
 */

import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useApiKey } from '@/context/ApiKeyContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Navbar } from '@/components/Navbar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CustomIcon } from '@/components/CustomIcon';
import { ApiKeyModal } from '@/components/ApiKeyModal';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 60) / 2; // Equal width and height for square-ish cards

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const { colorScheme, isDark } = useTheme();
  const { t } = useLanguage();
  const { activeKey, apiKeys } = useApiKey();
  const colors = Colors[colorScheme];

  // Modal state
  const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState(false);

  // Animation values for cards
  const photoScale = useSharedValue(1);
  const videoScale = useSharedValue(1);
  const floatValue = useSharedValue(0);

  React.useEffect(() => {
    // Floating animation for icons
    floatValue.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1500 }),
        withTiming(5, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value }],
  }));

  const handlePhotoPress = () => {
    photoScale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    router.push('/(tabs)/photo');
  };

  const handleVideoPress = () => {
    videoScale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    router.push('/(tabs)/video');
  };

  const photoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: photoScale.value }],
  }));

  const videoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: videoScale.value }],
  }));

  return (
    <ThemedView style={styles.container}>
      <Navbar showHomeButton={false} />

      {/* Welcome Section */}
      <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.welcomeSection}>
        <ThemedText style={[styles.welcomeText, { color: colors.textSecondary }]}>
          {t('welcome')}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('selectMedia')}
        </ThemedText>
      </Animated.View>

      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {/* Photo Card */}
        <Animated.View entering={FadeInUp.delay(500).duration(600)} style={photoAnimatedStyle}>
          <AnimatedTouchable
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
            onPress={handlePhotoPress}
            activeOpacity={0.9}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + '20' },
                floatStyle,
              ]}
            >
              <CustomIcon name="photo" size={44} color={colors.primary} />
            </Animated.View>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              {t('photo')}
            </ThemedText>
            <ThemedText style={[styles.cardDescription, { color: colors.textSecondary }]}>
              {t('photoDescription')}
            </ThemedText>
            <View style={[styles.cardArrow, { backgroundColor: colors.primary }]}>
              <IconSymbol name="arrow.right" size={16} color="#FFFFFF" />
            </View>
          </AnimatedTouchable>
        </Animated.View>

        {/* Video Card */}
        <Animated.View entering={FadeInUp.delay(700).duration(600)} style={videoAnimatedStyle}>
          <AnimatedTouchable
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
            onPress={handleVideoPress}
            activeOpacity={0.9}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.success + '20' },
                floatStyle,
              ]}
            >
              <CustomIcon name="video" size={44} color={colors.success} />
            </Animated.View>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              {t('video')}
            </ThemedText>
            <ThemedText style={[styles.cardDescription, { color: colors.textSecondary }]}>
              {t('videoDescription')}
            </ThemedText>
            <View style={[styles.cardArrow, { backgroundColor: colors.success }]}>
              <IconSymbol name="arrow.right" size={16} color="#FFFFFF" />
            </View>
          </AnimatedTouchable>
        </Animated.View>
      </View>

      {/* Editor Card - Full width */}
      <Animated.View entering={FadeInUp.delay(750).duration(600)}>
        <TouchableOpacity
          style={[
            styles.editorCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.warning,
              shadowColor: colors.shadow,
            },
          ]}
          onPress={() => router.push('/editor')}
          activeOpacity={0.8}
        >
          <View style={[styles.editorIconContainer, { backgroundColor: colors.warning + '20' }]}>
            <IconSymbol name="wand.and.stars" size={28} color={colors.warning} />
          </View>
          <View style={styles.editorContent}>
            <ThemedText style={styles.editorTitle}>{t('editorCard' as any) || 'Editor'}</ThemedText>
            <ThemedText style={[styles.editorDescription, { color: colors.textSecondary }]}>
              {t('editorCardDescription' as any) || 'Create compositions with objects'}
            </ThemedText>
          </View>
          <View style={[styles.editorArrow, { backgroundColor: colors.warning }]}>
            <IconSymbol name="arrow.right" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* API Key Management Card */}
      <Animated.View entering={FadeInUp.delay(800).duration(600)}>
        <TouchableOpacity
          style={[
            styles.apiKeyCard,
            {
              backgroundColor: colors.card,
              borderColor: activeKey ? colors.success : colors.warning,
              shadowColor: colors.shadow,
            },
          ]}
          onPress={() => setIsApiKeyModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.apiKeyIconContainer, { backgroundColor: (activeKey ? colors.success : colors.warning) + '20' }]}>
            <IconSymbol name="key.fill" size={24} color={activeKey ? colors.success : colors.warning} />
          </View>
          <View style={styles.apiKeyContent}>
            <ThemedText style={styles.apiKeyTitle}>{t('apiKeyManagement')}</ThemedText>
            <ThemedText style={[styles.apiKeyStatus, { color: colors.textSecondary }]}>
              {activeKey
                ? `${apiKeys.length} ${apiKeys.length === 1 ? 'key' : 'keys'} • ${t('activeKey')}`
                : t('noApiKeys')}
            </ThemedText>
          </View>
          <View style={[styles.apiKeyArrow, { backgroundColor: activeKey ? colors.success : colors.warning }]}>
            <IconSymbol name="chevron.right" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom Info */}
      <Animated.View
        entering={FadeInUp.delay(900).duration(600)}
        style={[styles.infoContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
      >
        <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
        <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
          {t('permissionInfo')}
        </ThemedText>
      </Animated.View>

      {/* API Key Modal */}
      <ApiKeyModal
        visible={isApiKeyModalVisible}
        onClose={() => setIsApiKeyModalVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
  },
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    justifyContent: 'center',
  },
  card: {
    width: CARD_SIZE,
    minHeight: CARD_SIZE + 40,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  apiKeyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  apiKeyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  apiKeyContent: {
    flex: 1,
    marginLeft: 12,
  },
  apiKeyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  apiKeyStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  apiKeyArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  editorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorContent: {
    flex: 1,
    marginLeft: 12,
  },
  editorTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  editorDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  editorArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
