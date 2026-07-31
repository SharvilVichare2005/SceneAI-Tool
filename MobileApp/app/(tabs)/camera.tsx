/**
 * Camera/Gallery Screen - Dynamic & Interactive
 * Full featured image capture and gallery with smooth animations
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
    Dimensions,
    ScrollView,
    Platform
} from 'react-native';
import { useCameraPermissions, CameraView as ExpoCameraView, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    ZoomIn,
    ZoomOut,
    SlideInRight,
    SlideOutLeft,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolate,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemeToggle } from '@/components/ThemeToggle';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width, height } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ViewMode = 'menu' | 'camera' | 'preview';

export default function CameraScreen() {
    const { colorScheme, isDark } = useTheme();
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [permission, requestPermission] = useCameraPermissions();
    const [viewMode, setViewMode] = useState<ViewMode>('menu');
    const [facing, setFacing] = useState<CameraType>('back');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const cameraRef = useRef<ExpoCameraView>(null);
    const scale = useSharedValue(1);

    // Pick multiple images from gallery
    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 10,
        });

        if (!result.canceled && result.assets.length > 0) {
            setSelectedImages(result.assets.map(asset => asset.uri));
            setActiveImageIndex(0);
            setViewMode('preview');
        }
    };

    // Take photo
    const takePhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                if (photo?.uri) {
                    setSelectedImages(prev => [...prev, photo.uri]);
                    setActiveImageIndex(selectedImages.length);
                    setViewMode('preview');
                }
            } catch (error) {
                console.error('Failed to take photo:', error);
            }
        }
    };

    // Open camera
    const openCamera = async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) return;
        }
        setViewMode('camera');
    };

    // Toggle camera facing
    const toggleFacing = () => {
        setFacing(prev => prev === 'back' ? 'front' : 'back');
    };

    // Remove image
    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        if (activeImageIndex >= selectedImages.length - 1) {
            setActiveImageIndex(Math.max(0, selectedImages.length - 2));
        }
        if (selectedImages.length <= 1) {
            setViewMode('menu');
        }
    };

    // Back to menu
    const goBack = () => {
        setViewMode('menu');
    };

    // Add more images
    const addMore = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 10,
        });

        if (!result.canceled && result.assets.length > 0) {
            setSelectedImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
        }
    };

    // Pinch to zoom gesture
    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = Math.max(1, Math.min(3, event.scale));
        })
        .onEnd(() => {
            scale.value = withSpring(1);
        });

    const animatedImageStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // Camera View
    if (viewMode === 'camera') {
        return (
            <View style={styles.fullScreen}>
                <ExpoCameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={facing}
                >
                    <View style={[styles.cameraUI, { paddingTop: insets.top }]}>
                        {/* Camera Header */}
                        <Animated.View entering={FadeInDown.duration(400)} style={styles.cameraHeader}>
                            <TouchableOpacity
                                style={[styles.cameraBtn, { backgroundColor: colors.overlay }]}
                                onPress={goBack}
                            >
                                <IconSymbol name="xmark" size={24} color="#FFFFFF" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.cameraBtn, { backgroundColor: colors.overlay }]}
                                onPress={toggleFacing}
                            >
                                <IconSymbol name="camera.rotate" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Camera Controls */}
                        <Animated.View entering={FadeInUp.duration(400)} style={[styles.cameraControls, { paddingBottom: insets.bottom + 20 }]}>
                            <TouchableOpacity style={styles.galleryBtn} onPress={pickImages}>
                                <IconSymbol name="photo.fill" size={28} color="#FFFFFF" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.shutterBtn} onPress={takePhoto}>
                                <View style={styles.shutterInner} />
                            </TouchableOpacity>

                            <View style={styles.placeholder} />
                        </Animated.View>
                    </View>
                </ExpoCameraView>
            </View>
        );
    }

    // Preview View
    if (viewMode === 'preview' && selectedImages.length > 0) {
        return (
            <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
                {/* Preview Header */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.previewHeader}>
                    <TouchableOpacity
                        style={[styles.headerBtn, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={goBack}
                    >
                        <IconSymbol name="chevron.left" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <ThemedText type="defaultSemiBold" style={styles.imageCounter}>
                        {activeImageIndex + 1} / {selectedImages.length}
                    </ThemedText>

                    <TouchableOpacity
                        style={[styles.headerBtn, { backgroundColor: colors.error + '20' }]}
                        onPress={() => removeImage(activeImageIndex)}
                    >
                        <IconSymbol name="trash" size={20} color={colors.error} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Main Image Preview */}
                <Animated.View entering={ZoomIn.duration(300)} style={styles.mainPreview}>
                    <GestureDetector gesture={pinchGesture}>
                        <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
                            <Image
                                source={{ uri: selectedImages[activeImageIndex] }}
                                style={styles.mainImage}
                                contentFit="contain"
                            />
                        </Animated.View>
                    </GestureDetector>
                </Animated.View>

                {/* Thumbnail Strip */}
                <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.thumbnailSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.thumbnailScroll}
                    >
                        {selectedImages.map((uri, index) => (
                            <TouchableOpacity
                                key={uri + index}
                                onPress={() => setActiveImageIndex(index)}
                                style={[
                                    styles.thumbnail,
                                    { borderColor: index === activeImageIndex ? colors.primary : colors.border }
                                ]}
                            >
                                <Image source={{ uri }} style={styles.thumbnailImage} contentFit="cover" />
                                {index === activeImageIndex && (
                                    <Animated.View
                                        entering={FadeIn.duration(200)}
                                        style={[styles.activeIndicator, { backgroundColor: colors.primary }]}
                                    />
                                )}
                            </TouchableOpacity>
                        ))}

                        {/* Add More Button */}
                        <TouchableOpacity
                            style={[styles.addMoreBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                            onPress={addMore}
                        >
                            <IconSymbol name="plus" size={28} color={colors.primary} />
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>

                {/* Action Buttons */}
                <Animated.View entering={FadeInUp.delay(300).duration(400)} style={[styles.actionBar, { paddingBottom: insets.bottom + 20 }]}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                        onPress={openCamera}
                    >
                        <IconSymbol name="camera.fill" size={22} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}>Daha Çek</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: colors.success }]}
                    >
                        <IconSymbol name="checkmark" size={22} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}>Etiketle</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ThemedView>
        );
    }

    // Menu View (Default)
    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
                <View>
                    <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Görsel Yükle
                    </ThemedText>
                    <ThemedText type="title" style={styles.title}>
                        Kamera & Galeri
                    </ThemedText>
                </View>
                <ThemeToggle />
            </Animated.View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Camera Card */}
                <Animated.View entering={FadeInUp.delay(200).duration(500)}>
                    <AnimatedTouchable
                        style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={openCamera}
                        activeOpacity={0.85}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: colors.primary + '15' }]}>
                            <IconSymbol name="camera.fill" size={40} color={colors.primary} />
                        </View>
                        <View style={styles.optionContent}>
                            <ThemedText type="subtitle" style={styles.optionTitle}>
                                Fotoğraf Çek
                            </ThemedText>
                            <ThemedText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                                Kameranızı kullanarak yeni görsel çekin
                            </ThemedText>
                            {!permission?.granted && (
                                <View style={[styles.permissionBadge, { backgroundColor: colors.warning + '20' }]}>
                                    <IconSymbol name="lock.fill" size={14} color={colors.warning} />
                                    <Text style={[styles.badgeText, { color: colors.warning }]}>İzin Gerekli</Text>
                                </View>
                            )}
                        </View>
                        <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
                    </AnimatedTouchable>
                </Animated.View>

                {/* Gallery Card */}
                <Animated.View entering={FadeInUp.delay(350).duration(500)}>
                    <AnimatedTouchable
                        style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={pickImages}
                        activeOpacity={0.85}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: colors.success + '15' }]}>
                            <IconSymbol name="photo.on.rectangle.angled" size={40} color={colors.success} />
                        </View>
                        <View style={styles.optionContent}>
                            <ThemedText type="subtitle" style={styles.optionTitle}>
                                Galeriden Seç
                            </ThemedText>
                            <ThemedText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                                Birden fazla görsel seçebilirsiniz
                            </ThemedText>
                            <View style={[styles.featureBadge, { backgroundColor: colors.success + '20' }]}>
                                <IconSymbol name="square.stack" size={14} color={colors.success} />
                                <Text style={[styles.badgeText, { color: colors.success }]}>Çoklu Seçim</Text>
                            </View>
                        </View>
                        <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
                    </AnimatedTouchable>
                </Animated.View>

                {/* Tips Section */}
                <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.tipsSection}>
                    <ThemedText type="defaultSemiBold" style={[styles.tipsTitle, { color: colors.textSecondary }]}>
                        💡 İpuçları
                    </ThemedText>

                    <View style={[styles.tipCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <IconSymbol name="hand.pinch" size={20} color={colors.primary} />
                        <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
                            Önizlemede zoom yapmak için sıkıştırın
                        </ThemedText>
                    </View>

                    <View style={[styles.tipCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <IconSymbol name="photo.stack" size={20} color={colors.success} />
                        <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
                            Galeriden birden fazla görsel seçebilirsiniz
                        </ThemedText>
                    </View>
                </Animated.View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fullScreen: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    cameraUI: {
        flex: 1,
        justifyContent: 'space-between',
    },
    cameraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    cameraBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    galleryBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutterBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    shutterInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
    },
    placeholder: {
        width: 56,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 4,
    },
    title: {
        fontSize: 28,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
        gap: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        gap: 16,
        marginBottom: 0,
    },
    optionIcon: {
        width: 72,
        height: 72,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        marginBottom: 4,
    },
    optionDesc: {
        fontSize: 14,
        marginBottom: 8,
    },
    permissionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    featureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    tipsSection: {
        marginTop: 16,
        gap: 12,
    },
    tipsTitle: {
        marginBottom: 4,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 16,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCounter: {
        fontSize: 16,
    },
    mainPreview: {
        flex: 1,
        margin: 12,
        borderRadius: 20,
        overflow: 'hidden',
    },
    imageContainer: {
        flex: 1,
    },
    mainImage: {
        flex: 1,
        width: '100%',
    },
    thumbnailSection: {
        paddingVertical: 12,
    },
    thumbnailScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    thumbnail: {
        width: 70,
        height: 70,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        marginRight: 12,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    addMoreBtn: {
        width: 70,
        height: 70,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBar: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
    },
    primaryBtn: {
        flex: 1.5,
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
