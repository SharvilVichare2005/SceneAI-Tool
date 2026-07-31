/**
 * AI Analysis Screen
 * Full image analysis with all 5 Moondream AI modes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    SlideInRight,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Navbar } from '@/components/Navbar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ModeSelector, AnalysisMode } from '@/components/ModeSelector';
import { BoundingBoxOverlay } from '@/components/BoundingBoxOverlay';
import { PointMarkerOverlay } from '@/components/PointMarkerOverlay';
import { SegmentOverlay } from '@/components/SegmentOverlay';
import MoondreamApi, {
    CaptionLength,
    Region,
    Point as PointType,
} from '@/services/moondreamApi';
import { createCutoutWithBbox } from '@/services/ImageProcessor';
import { useApiKey } from '@/context/ApiKeyContext';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width - 40;
const IMAGE_HEIGHT = IMAGE_WIDTH * 0.75;

type ResultType = {
    caption?: string;
    answer?: string;
    objects?: Region[];
    points?: PointType[];
    segment?: { path: string; bbox: Region };
};

export default function AnalysisScreen() {
    const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
    const { colorScheme } = useTheme();
    const { t } = useLanguage();
    const { activeKey } = useApiKey();
    const colors = Colors[colorScheme];

    // State
    const [selectedMode, setSelectedMode] = useState<AnalysisMode>('caption');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ResultType>({});
    const [inputText, setInputText] = useState('');
    const [captionLength, setCaptionLength] = useState<CaptionLength>('normal');
    const [imageDimensions, setImageDimensions] = useState({ width: IMAGE_WIDTH, height: IMAGE_HEIGHT });
    const [imageAspectRatio, setImageAspectRatio] = useState(1);
    const [isProcessingCutout, setIsProcessingCutout] = useState(false);

    // Get image dimensions for overlay calculations
    useEffect(() => {
        if (imageUri) {
            Image.getSize(imageUri, (w, h) => {
                const aspectRatio = w / h;
                setImageAspectRatio(aspectRatio);
                const displayWidth = IMAGE_WIDTH;
                const displayHeight = displayWidth / aspectRatio;
                setImageDimensions({ width: displayWidth, height: Math.min(displayHeight, IMAGE_HEIGHT) });
            });
        }
    }, [imageUri]);

    // Calculate actual rendered image layout within container (accounting for resizeMode="contain")
    const getRenderedImageLayout = () => {
        const containerWidth = imageDimensions.width;
        const containerHeight = imageDimensions.height;
        const containerAspectRatio = containerWidth / containerHeight;

        let renderWidth, renderHeight, offsetX, offsetY;

        if (containerAspectRatio > imageAspectRatio) {
            // Container is wider than image - pillarboxing (vertical image in landscape container)
            renderHeight = containerHeight;
            renderWidth = containerHeight * imageAspectRatio;
            offsetX = (containerWidth - renderWidth) / 2;
            offsetY = 0;
        } else {
            // Container is taller than image - letterboxing (horizontal image in portrait container)
            renderWidth = containerWidth;
            renderHeight = containerWidth / imageAspectRatio;
            offsetX = 0;
            offsetY = (containerHeight - renderHeight) / 2;
        }

        return {
            x: offsetX,
            y: offsetY,
            width: renderWidth,
            height: renderHeight,
        };
    };

    // Clear results when mode changes
    useEffect(() => {
        setResult({});
        setError(null);
        setInputText('');
    }, [selectedMode]);

    const handleAnalyze = useCallback(async () => {
        if (!imageUri) {
            setError(t('apiError' as any) || 'No image selected');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check if API key is configured
            if (!activeKey) {
                setError(t('noApiKey' as any) || 'No API key configured. Please add an API key in the settings.');
                setIsLoading(false);
                return;
            }

            switch (selectedMode) {
                case 'caption': {
                    const response = await MoondreamApi.caption(imageUri, captionLength, activeKey);
                    setResult({ caption: response.caption });
                    break;
                }
                case 'query': {
                    if (!inputText.trim()) {
                        setError(t('enterQuestion' as any) || 'Please enter a question');
                        setIsLoading(false);
                        return;
                    }
                    const response = await MoondreamApi.query(imageUri, inputText.trim(), activeKey);
                    setResult({ answer: response.answer });
                    break;
                }
                case 'detect': {
                    if (!inputText.trim()) {
                        setError(t('enterObject' as any) || 'Please enter an object to find');
                        setIsLoading(false);
                        return;
                    }
                    const response = await MoondreamApi.detect(imageUri, inputText.trim(), activeKey);
                    setResult({ objects: response.objects });
                    break;
                }
                case 'point': {
                    if (!inputText.trim()) {
                        setError(t('enterObject' as any) || 'Please enter an object to find');
                        setIsLoading(false);
                        return;
                    }
                    const response = await MoondreamApi.point(imageUri, inputText.trim(), activeKey);
                    setResult({ points: response.points });
                    break;
                }
                case 'segment': {
                    if (!inputText.trim()) {
                        setError(t('enterObject' as any) || 'Please enter an object to segment');
                        setIsLoading(false);
                        return;
                    }
                    const response = await MoondreamApi.segment(imageUri, inputText.trim(), activeKey);
                    setResult({ segment: { path: response.path, bbox: response.bbox } });
                    break;
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : (t('apiError' as any) || 'API error occurred');
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedMode, imageUri, inputText, captionLength, t, activeKey]);

    // Handle creating cutout and navigating to editor
    const handleCreateCutout = useCallback(async () => {
        if (!imageUri || !result.segment) {
            return;
        }

        setIsProcessingCutout(true);
        try {
            const cutoutUri = await createCutoutWithBbox(
                imageUri,
                result.segment.path,
                result.segment.bbox
            );

            router.push({
                pathname: '/editor',
                params: { cutoutUri, originalImageUri: imageUri },
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : (t('processingError' as any) || 'Failed to process cutout');
            Alert.alert(
                t('error' as any) || 'Error',
                message,
                [{ text: t('ok' as any) || 'OK' }]
            );
        } finally {
            setIsProcessingCutout(false);
        }
    }, [imageUri, result.segment, t]);

    const renderInputArea = () => {
        if (selectedMode === 'caption') {
            return (
                <Animated.View entering={FadeIn.duration(300)} style={styles.captionLengthContainer}>
                    <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
                        {t('captionLength' as any) || 'Caption Length'}
                    </ThemedText>
                    <View style={styles.lengthButtonsRow}>
                        {(['short', 'normal', 'long'] as CaptionLength[]).map((len) => (
                            <TouchableOpacity
                                key={len}
                                style={[
                                    styles.lengthButton,
                                    {
                                        backgroundColor: captionLength === len ? colors.primary : colors.card,
                                        borderColor: captionLength === len ? colors.primary : colors.border,
                                    },
                                ]}
                                onPress={() => setCaptionLength(len)}
                            >
                                <ThemedText
                                    style={[
                                        styles.lengthButtonText,
                                        { color: captionLength === len ? '#FFFFFF' : colors.text },
                                    ]}
                                >
                                    {t(`caption${len.charAt(0).toUpperCase() + len.slice(1)}` as any) || len}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            );
        }

        const placeholder =
            selectedMode === 'query'
                ? t('enterQuestion' as any) || 'Enter your question...'
                : t('enterObject' as any) || 'Enter object to find...';

        return (
            <Animated.View entering={FadeIn.duration(300)} style={styles.inputContainer}>
                <TextInput
                    style={[
                        styles.textInput,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            color: colors.text,
                        },
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline={selectedMode === 'query'}
                    numberOfLines={selectedMode === 'query' ? 2 : 1}
                    editable={!isLoading}
                />
            </Animated.View>
        );
    };

    const renderResult = () => {
        if (error) {
            return (
                <Animated.View entering={FadeInDown.duration(300)} style={[styles.resultCard, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
                    <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
                </Animated.View>
            );
        }

        if (result.caption) {
            return (
                <Animated.View entering={FadeInDown.duration(300)} style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <IconSymbol name="text.alignleft" size={20} color={colors.primary} />
                    <ThemedText style={[styles.resultText, { color: colors.text }]}>{result.caption}</ThemedText>
                </Animated.View>
            );
        }

        if (result.answer) {
            return (
                <Animated.View entering={FadeInDown.duration(300)} style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <IconSymbol name="text.bubble.fill" size={20} color={colors.primary} />
                    <ThemedText style={[styles.resultText, { color: colors.text }]}>{result.answer}</ThemedText>
                </Animated.View>
            );
        }

        if (result.objects) {
            return (
                <Animated.View entering={FadeInDown.duration(300)} style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <IconSymbol name="square.dashed" size={20} color={colors.primary} />
                    <ThemedText style={[styles.resultText, { color: colors.text }]}>
                        {result.objects.length} {t('objectsFound' as any) || 'objects found'}
                    </ThemedText>
                </Animated.View>
            );
        }

        if (result.points) {
            return (
                <Animated.View entering={FadeInDown.duration(300)} style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <IconSymbol name="mappin" size={20} color={colors.primary} />
                    <ThemedText style={[styles.resultText, { color: colors.text }]}>
                        {result.points.length} {t('pointsFound' as any) || 'points found'}
                    </ThemedText>
                </Animated.View>
            );
        }

        if (result.segment) {
            return (
                <Animated.View entering={FadeInDown.duration(300)}>
                    <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <IconSymbol name="scissors" size={20} color={colors.success} />
                        <ThemedText style={[styles.resultText, { color: colors.text }]}>
                            {t('segmentComplete' as any) || 'Segmentation complete'}
                        </ThemedText>
                    </View>

                    {/* Create Sticker & Edit Button */}
                    <TouchableOpacity
                        style={[
                            styles.stickerButton,
                            {
                                backgroundColor: isProcessingCutout ? colors.textSecondary : colors.success,
                            },
                        ]}
                        onPress={handleCreateCutout}
                        disabled={isProcessingCutout || isLoading}
                        activeOpacity={0.8}
                    >
                        {isProcessingCutout ? (
                            <>
                                <ActivityIndicator color="#FFFFFF" size="small" />
                                <ThemedText style={styles.stickerButtonText}>
                                    {t('processingCutout' as any) || 'Processing cutout...'}
                                </ThemedText>
                            </>
                        ) : (
                            <>
                                <ThemedText style={styles.stickerButtonEmoji}>✂️</ThemedText>
                                <ThemedText style={styles.stickerButtonText}>
                                    {t('createStickerEdit' as any) || 'Create Sticker & Edit'}
                                </ThemedText>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            );
        }

        return null;
    };

    const renderOverlays = () => {
        const imageLayout = getRenderedImageLayout();

        if (result.objects && result.objects.length > 0) {
            return (
                <BoundingBoxOverlay
                    boxes={result.objects}
                    imageWidth={imageDimensions.width}
                    imageHeight={imageDimensions.height}
                    imageLayout={imageLayout}
                    objectName={inputText}
                />
            );
        }

        if (result.points && result.points.length > 0) {
            return (
                <PointMarkerOverlay
                    points={result.points}
                    imageWidth={imageDimensions.width}
                    imageHeight={imageDimensions.height}
                    imageLayout={imageLayout}
                />
            );
        }

        if (result.segment) {
            return (
                <SegmentOverlay
                    svgPath={result.segment.path}
                    bbox={result.segment.bbox}
                    imageWidth={imageDimensions.width}
                    imageHeight={imageDimensions.height}
                    imageLayout={imageLayout}
                />
            );
        }

        return null;
    };

    if (!imageUri) {
        return (
            <ThemedView style={styles.container}>
                <Navbar />
                <View style={styles.errorContainer}>
                    <IconSymbol name="photo" size={48} color={colors.textSecondary} />
                    <ThemedText style={{ color: colors.textSecondary }}>
                        {t('noImage' as any) || 'No image selected'}
                    </ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Navbar />
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title */}
                    <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.titleSection}>
                        <ThemedText type="title" style={styles.pageTitle}>
                            {t('analysisTitle' as any) || 'AI Analysis'}
                        </ThemedText>
                    </Animated.View>

                    {/* Image with overlays */}
                    <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.imageContainer}>
                        <View style={[styles.imageWrapper, { width: imageDimensions.width, height: imageDimensions.height }]}>
                            <Image
                                source={{ uri: imageUri }}
                                style={[styles.image, { width: imageDimensions.width, height: imageDimensions.height }]}
                                resizeMode="contain"
                            />
                            {renderOverlays()}
                        </View>
                    </Animated.View>

                    {/* Mode Selector */}
                    <ModeSelector
                        selectedMode={selectedMode}
                        onModeChange={setSelectedMode}
                        disabled={isLoading}
                    />

                    {/* Input Area */}
                    {renderInputArea()}

                    {/* Analyze Button */}
                    <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[
                                styles.analyzeButton,
                                { backgroundColor: isLoading ? colors.textSecondary : colors.primary },
                            ]}
                            onPress={handleAnalyze}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <>
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                    <ThemedText style={styles.buttonText}>
                                        {t('analyzing' as any) || 'Analyzing...'}
                                    </ThemedText>
                                </>
                            ) : (
                                <>
                                    <IconSymbol name="sparkles" size={20} color="#FFFFFF" />
                                    <ThemedText style={styles.buttonText}>
                                        {t('analyze' as any) || 'Analyze'}
                                    </ThemedText>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Result */}
                    {renderResult()}

                    {/* Back Button */}
                    <TouchableOpacity
                        style={[styles.backButton, { borderColor: colors.border }]}
                        onPress={() => router.back()}
                    >
                        <IconSymbol name="arrow.left" size={18} color={colors.text} />
                        <ThemedText style={[styles.backButtonText, { color: colors.text }]}>
                            {t('back' as any) || 'Back'}
                        </ThemedText>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    titleSection: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    imageContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    imageWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        borderRadius: 16,
    },
    captionLengthContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    inputLabel: {
        fontSize: 13,
        marginBottom: 8,
    },
    lengthButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    lengthButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    lengthButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        minHeight: 48,
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginHorizontal: 20,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    resultText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    stickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginHorizontal: 20,
        marginTop: 12,
        paddingVertical: 16,
        borderRadius: 16,
    },
    stickerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    stickerButtonEmoji: {
        fontSize: 18,
    },
});
