/**
 * Photo Screen
 * Camera and Gallery options for photo capture/selection
 */

import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import { CameraView, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    SlideInRight,
    SlideOutLeft,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withSequence,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Navbar } from '@/components/Navbar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CustomIcon } from '@/components/CustomIcon';
import { usePermissions } from '@/hooks/usePermissions';

const { width, height } = Dimensions.get('window');
const CARD_SIZE = (width - 60) / 2; // Equal card sizes

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ViewMode = 'selection' | 'camera' | 'preview';

export default function PhotoScreen() {
    const { colorScheme, isDark } = useTheme();
    const { t } = useLanguage();
    const colors = Colors[colorScheme];
    const { permissions, requestCameraPermission, requestMediaLibraryPermission } = usePermissions();

    const [viewMode, setViewMode] = useState<ViewMode>('selection');
    const [facing, setFacing] = useState<CameraType>('back');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const cameraRef = useRef<CameraView>(null);

    // Animation values
    const cameraScale = useSharedValue(1);
    const galleryScale = useSharedValue(1);

    const handleCameraPress = async () => {
        cameraScale.value = withSequence(
            withSpring(0.95, { damping: 10 }),
            withSpring(1, { damping: 15 })
        );

        const granted = await requestCameraPermission();
        if (granted) {
            setViewMode('camera');
        }
    };

    const handleGalleryPress = async () => {
        galleryScale.value = withSequence(
            withSpring(0.95, { damping: 10 }),
            withSpring(1, { damping: 15 })
        );

        const granted = await requestMediaLibraryPermission();
        if (granted) {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                setSelectedImage(result.assets[0].uri);
                setViewMode('preview');
            }
        }
    };

    const handleTakePhoto = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync();
            if (photo) {
                setSelectedImage(photo.uri);
                setViewMode('preview');
            }
        }
    };

    const handleFlipCamera = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const handleBack = () => {
        setViewMode('selection');
        setSelectedImage(null);
    };

    const cameraAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cameraScale.value }],
    }));

    const galleryAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: galleryScale.value }],
    }));

    // Camera View
    if (viewMode === 'camera') {
        return (
            <Animated.View entering={SlideInRight.duration(400)} style={styles.fullScreen}>
                <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
                    {/* Camera Controls Overlay */}
                    <View style={styles.cameraOverlay}>
                        {/* Top Bar */}
                        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.cameraTopBar}>
                            <TouchableOpacity
                                style={[styles.cameraButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                                onPress={handleBack}
                            >
                                <CustomIcon name="back" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.cameraButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                                onPress={handleFlipCamera}
                            >
                                <CustomIcon name="camera-rotate" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Bottom Bar */}
                        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.cameraBottomBar}>
                            <TouchableOpacity
                                style={styles.captureButton}
                                onPress={handleTakePhoto}
                            >
                                <View style={styles.captureButtonInner} />
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </CameraView>
            </Animated.View>
        );
    }

    // Preview View
    if (viewMode === 'preview' && selectedImage) {
        return (
            <Animated.View entering={FadeIn.duration(400)} style={styles.fullScreen}>
                <ThemedView style={styles.previewContainer}>
                    <Navbar />
                    <View style={styles.previewContent}>
                        <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="contain" />
                        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.previewActions}>
                            <TouchableOpacity
                                style={[styles.previewButton, { backgroundColor: colors.error }]}
                                onPress={handleBack}
                            >
                                <IconSymbol name="trash.fill" size={20} color="#FFFFFF" />
                                <ThemedText style={styles.previewButtonText}>{t('cancel')}</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.previewButton, { backgroundColor: colors.success }]}
                                onPress={() => router.push({ pathname: '/(tabs)/analysis', params: { imageUri: selectedImage } })}
                            >
                                <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
                                <ThemedText style={styles.previewButtonText}>{t('continueText')}</ThemedText>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </ThemedView>
            </Animated.View>
        );
    }

    // Selection View (Default)
    return (
        <ThemedView style={styles.container}>
            <Navbar />

            {/* Title Section */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.titleSection}>
                <ThemedText type="title" style={styles.pageTitle}>
                    {t('photoPageTitle')}
                </ThemedText>
                <ThemedText style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
                    {t('photoPageSubtitle')}
                </ThemedText>
            </Animated.View>

            {/* Options Cards */}
            <View style={styles.cardsContainer}>
                {/* Camera Card */}
                <Animated.View entering={FadeInUp.delay(400).duration(500)} style={[cameraAnimatedStyle, styles.cardWrapper]}>
                    <AnimatedTouchable
                        style={[
                            styles.optionCard,
                            {
                                backgroundColor: isDark ? colors.card : '#FFFFFF',
                                borderColor: isDark ? colors.border : colors.primary + '30',
                                shadowColor: colors.primary,
                            },
                        ]}
                        onPress={handleCameraPress}
                        activeOpacity={0.9}
                    >
                        <View style={[styles.iconGlow, { backgroundColor: colors.primary + '15' }]} />
                        <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                            <CustomIcon name="camera" size={40} color={colors.primary} />
                        </View>
                        <ThemedText type="subtitle" style={styles.optionTitle}>
                            {t('camera')}
                        </ThemedText>
                        <ThemedText style={[styles.optionDescription, { color: colors.textSecondary }]}>
                            {t('cameraDescription')}
                        </ThemedText>
                        <View style={[styles.permissionBadge, {
                            backgroundColor: permissions.camera === 'granted' ? colors.success + '20' : colors.warning + '20'
                        }]}>
                            <IconSymbol
                                name={permissions.camera === 'granted' ? 'checkmark.circle.fill' : 'exclamationmark.circle.fill'}
                                size={14}
                                color={permissions.camera === 'granted' ? colors.success : colors.warning}
                            />
                            <ThemedText style={[styles.permissionText, {
                                color: permissions.camera === 'granted' ? colors.success : colors.warning
                            }]}>
                                {permissions.camera === 'granted' ? t('permissionGranted') : t('permissionRequired')}
                            </ThemedText>
                        </View>
                    </AnimatedTouchable>
                </Animated.View>

                {/* Gallery Card */}
                <Animated.View entering={FadeInUp.delay(600).duration(500)} style={[galleryAnimatedStyle, styles.cardWrapper]}>
                    <AnimatedTouchable
                        style={[
                            styles.optionCard,
                            {
                                backgroundColor: isDark ? colors.card : '#FFFFFF',
                                borderColor: isDark ? colors.border : colors.success + '30',
                                shadowColor: colors.success,
                            },
                        ]}
                        onPress={handleGalleryPress}
                        activeOpacity={0.9}
                    >
                        <View style={[styles.iconGlow, { backgroundColor: colors.success + '15' }]} />
                        <View style={[styles.optionIcon, { backgroundColor: colors.success + '20' }]}>
                            <CustomIcon name="gallery" size={40} color={colors.success} />
                        </View>
                        <ThemedText type="subtitle" style={styles.optionTitle}>
                            {t('gallery')}
                        </ThemedText>
                        <ThemedText style={[styles.optionDescription, { color: colors.textSecondary }]}>
                            {t('galleryDescription')}
                        </ThemedText>
                        <View style={[styles.permissionBadge, {
                            backgroundColor: permissions.mediaLibrary === 'granted' ? colors.success + '20' : colors.warning + '20'
                        }]}>
                            <IconSymbol
                                name={permissions.mediaLibrary === 'granted' ? 'checkmark.circle.fill' : 'exclamationmark.circle.fill'}
                                size={14}
                                color={permissions.mediaLibrary === 'granted' ? colors.success : colors.warning}
                            />
                            <ThemedText style={[styles.permissionText, {
                                color: permissions.mediaLibrary === 'granted' ? colors.success : colors.warning
                            }]}>
                                {permissions.mediaLibrary === 'granted' ? t('permissionGranted') : t('permissionRequired')}
                            </ThemedText>
                        </View>
                    </AnimatedTouchable>
                </Animated.View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fullScreen: {
        flex: 1,
    },
    titleSection: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    pageSubtitle: {
        fontSize: 15,
        lineHeight: 22,
    },
    cardsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 16,
        justifyContent: 'center',
    },
    cardWrapper: {
        flex: 1,
        maxWidth: CARD_SIZE,
    },
    optionCard: {
        width: '100%',
        height: CARD_SIZE + 60,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1.5,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 12,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    iconGlow: {
        position: 'absolute',
        top: -30,
        width: 140,
        height: 140,
        borderRadius: 70,
        opacity: 0.6,
    },
    optionIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        zIndex: 1,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    optionDescription: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
    },
    permissionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    permissionText: {
        fontSize: 11,
        fontWeight: '600',
    },
    // Camera styles
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    cameraTopBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    cameraButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraBottomBar: {
        alignItems: 'center',
        paddingBottom: 50,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
    },
    // Preview styles
    previewContainer: {
        flex: 1,
    },
    previewContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    previewImage: {
        width: width - 40,
        height: height * 0.5,
        borderRadius: 16,
    },
    previewActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 24,
    },
    previewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
    },
    previewButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});
