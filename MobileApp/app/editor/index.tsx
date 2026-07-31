/**
 * Editor Screen - Redesigned with Independent Layer Movement
 * Features: Page size adjustment, enhanced backgrounds, gesture controls,
 * object storage, gallery import, and previous objects loading
 * Each layer can be moved, scaled, and rotated independently
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Image,
    TouchableOpacity,
    Dimensions,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
    ScrollView,
    TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PROJECTS_DIR = `${FileSystem.documentDirectory}MyProjects/`;
const OBJECTS_DIR = `${FileSystem.documentDirectory}Objects/`;

// Canvas size presets
const CANVAS_SIZES = {
    small: { width: 280, height: 280, label: 'pageSizeSmall' },
    medium: { width: 340, height: 340, label: 'pageSizeMedium' },
    large: { width: 400, height: 400, label: 'pageSizeLarge' },
};

type CanvasSizeKey = keyof typeof CANVAS_SIZES | 'custom';
type BackgroundMode = 'white' | 'black' | 'checkerboard' | 'bluescreen' | 'greenscreen' | 'image';

interface EditorLayer {
    id: string;
    uri: string;
}

interface SavedObject {
    name: string;
    uri: string;
    date: string;
}

/**
 * DraggableLayer Component - Each layer has its own independent gestures
 */
interface DraggableLayerProps {
    uri: string;
    size: number;
    isActive: boolean;
    onSelect: () => void;
}

function DraggableLayer({ uri, size, isActive, onSelect }: DraggableLayerProps) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const savedScale = useSharedValue(1);
    const savedRotation = useSharedValue(0);

    // Pan gesture for this layer
    const panGesture = Gesture.Pan()
        .onStart(() => {
            runOnJS(onSelect)();
        })
        .onUpdate((event) => {
            translateX.value = savedTranslateX.value + event.translationX;
            translateY.value = savedTranslateY.value + event.translationY;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    // Pinch gesture for this layer
    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            runOnJS(onSelect)();
        })
        .onUpdate((event) => {
            scale.value = savedScale.value * event.scale;
        })
        .onEnd(() => {
            const clampedScale = Math.min(Math.max(scale.value, 0.2), 5);
            scale.value = withSpring(clampedScale);
            savedScale.value = clampedScale;
        });

    // Rotation gesture for this layer
    const rotationGesture = Gesture.Rotation()
        .onStart(() => {
            runOnJS(onSelect)();
        })
        .onUpdate((event) => {
            rotation.value = savedRotation.value + event.rotation;
        })
        .onEnd(() => {
            savedRotation.value = rotation.value;
        });

    // Combine gestures
    const composedGesture = Gesture.Simultaneous(
        panGesture,
        Gesture.Simultaneous(pinchGesture, rotationGesture)
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
            { rotate: `${rotation.value}rad` },
        ],
    }));

    return (
        <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.draggableLayer, animatedStyle]}>
                <Image
                    source={{ uri }}
                    style={[
                        styles.layerImage,
                        { width: size * 0.5, height: size * 0.5 },
                        isActive && styles.activeLayerBorder,
                    ]}
                    resizeMode="contain"
                />
            </Animated.View>
        </GestureDetector>
    );
}

export default function EditorScreen() {
    const { cutoutUri, originalImageUri } = useLocalSearchParams<{
        cutoutUri: string;
        originalImageUri: string;
    }>();
    const { colorScheme } = useTheme();
    const { t } = useLanguage();
    const colors = Colors[colorScheme];

    // Canvas ref for capturing
    const canvasRef = useRef<View>(null);

    // State
    const [canvasSize, setCanvasSize] = useState<CanvasSizeKey>('medium');
    const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('checkerboard');
    const [isSaving, setIsSaving] = useState(false);
    const [showSizeModal, setShowSizeModal] = useState(false);
    const [showObjectsModal, setShowObjectsModal] = useState(false);
    const [savedObjects, setSavedObjects] = useState<SavedObject[]>([]);
    const [layers, setLayers] = useState<EditorLayer[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

    // New state for custom canvas and background image
    const [customCanvasWidth, setCustomCanvasWidth] = useState('400');
    const [customCanvasHeight, setCustomCanvasHeight] = useState('400');
    const [backgroundImageUri, setBackgroundImageUri] = useState<string | null>(null);

    // Get current canvas dimensions
    const currentCanvasSize = canvasSize === 'custom'
        ? { width: parseInt(customCanvasWidth) || 400, height: parseInt(customCanvasHeight) || 400, label: 'customSize' }
        : CANVAS_SIZES[canvasSize];

    // Initialize first layer from cutoutUri
    useEffect(() => {
        if (cutoutUri && layers.length === 0) {
            const initialLayer: EditorLayer = {
                id: `layer_${Date.now()}`,
                uri: cutoutUri,
            };
            setLayers([initialLayer]);
            setActiveLayerId(initialLayer.id);
        }
    }, [cutoutUri]);

    // Load saved objects
    const loadSavedObjects = useCallback(async () => {
        try {
            const dirInfo = await FileSystem.getInfoAsync(OBJECTS_DIR);
            if (!dirInfo.exists) {
                setSavedObjects([]);
                return;
            }

            const files = await FileSystem.readDirectoryAsync(OBJECTS_DIR);
            const objects: SavedObject[] = files
                .filter(file => file.endsWith('.png'))
                .map(file => ({
                    name: file.replace('.png', ''),
                    uri: OBJECTS_DIR + file,
                    date: file.split('_')[1] || '',
                }));
            setSavedObjects(objects);
        } catch (error) {
            console.error('Error loading saved objects:', error);
            setSavedObjects([]);
        }
    }, []);

    // Delete active layer
    const deleteActiveLayer = () => {
        if (!activeLayerId) {
            Alert.alert(
                t('error' as any) || 'Error',
                t('noActiveLayer' as any) || 'No active layer',
                [{ text: t('ok' as any) || 'OK' }]
            );
            return;
        }
        setLayers(prev => prev.filter(layer => layer.id !== activeLayerId));
        setActiveLayerId(layers.length > 1 ? layers[0].id : null);
    };

    // Bring active layer forward
    const bringLayerForward = () => {
        if (!activeLayerId) return;
        const currentIndex = layers.findIndex(l => l.id === activeLayerId);
        if (currentIndex < layers.length - 1) {
            const newLayers = [...layers];
            [newLayers[currentIndex], newLayers[currentIndex + 1]] =
                [newLayers[currentIndex + 1], newLayers[currentIndex]];
            setLayers(newLayers);
        }
    };

    // Send active layer backward
    const sendLayerBackward = () => {
        if (!activeLayerId) return;
        const currentIndex = layers.findIndex(l => l.id === activeLayerId);
        if (currentIndex > 0) {
            const newLayers = [...layers];
            [newLayers[currentIndex], newLayers[currentIndex - 1]] =
                [newLayers[currentIndex - 1], newLayers[currentIndex]];
            setLayers(newLayers);
        }
    };

    // Pick background image
    const pickBackgroundImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                setBackgroundImageUri(result.assets[0].uri);
                setBackgroundMode('image');
            }
        } catch (error) {
            console.error('Error picking background image:', error);
        }
    };

    // Apply custom canvas size
    const applyCustomCanvasSize = () => {
        const width = parseInt(customCanvasWidth);
        const height = parseInt(customCanvasHeight);

        if (isNaN(width) || isNaN(height) || width < 100 || width > 800 || height < 100 || height > 800) {
            Alert.alert(
                t('invalidSize' as any) || 'Invalid size',
                t('sizeRange' as any) || 'Size must be between 100-800',
                [{ text: t('ok' as any) || 'OK' }]
            );
            return;
        }

        setCanvasSize('custom');
        setShowSizeModal(false);
    };

    // Get background style/color
    const getBackgroundStyle = () => {
        switch (backgroundMode) {
            case 'white':
                return { backgroundColor: '#FFFFFF' };
            case 'black':
                return { backgroundColor: '#000000' };
            case 'checkerboard':
                return { backgroundColor: '#CCCCCC' };
            case 'bluescreen':
                return { backgroundColor: '#0047AB' };
            case 'greenscreen':
                return { backgroundColor: '#00B140' };
            case 'image':
                return { backgroundColor: 'transparent' };
        }
    };

    // Render checkerboard pattern
    const renderCheckerboard = () => {
        if (backgroundMode !== 'checkerboard') return null;

        const squareSize = 20;
        const cols = Math.ceil(currentCanvasSize.width / squareSize);
        const rows = Math.ceil(currentCanvasSize.height / squareSize);
        const squares = [];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const isEven = (row + col) % 2 === 0;
                squares.push(
                    <View
                        key={`${row}-${col}`}
                        style={{
                            position: 'absolute',
                            left: col * squareSize,
                            top: row * squareSize,
                            width: squareSize,
                            height: squareSize,
                            backgroundColor: isEven ? '#FFFFFF' : '#CCCCCC',
                        }}
                    />
                );
            }
        }

        return <View style={styles.checkerboardContainer}>{squares}</View>;
    };

    // Add image from gallery
    const addFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                const newLayer: EditorLayer = {
                    id: `layer_${Date.now()}`,
                    uri: result.assets[0].uri,
                };
                setLayers(prev => [...prev, newLayer]);
                setActiveLayerId(newLayer.id);
            }
        } catch (error) {
            console.error('Error picking image:', error);
        }
    };

    // Add saved object
    const addSavedObject = (obj: SavedObject) => {
        const newLayer: EditorLayer = {
            id: `layer_${Date.now()}`,
            uri: obj.uri,
        };
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
        setShowObjectsModal(false);
    };

    // Save current cutout as object
    const saveAsObject = async () => {
        if (layers.length === 0) {
            Alert.alert(
                t('error' as any) || 'Error',
                t('noImage' as any) || 'No image to save',
                [{ text: t('ok' as any) || 'OK' }]
            );
            return;
        }

        try {
            const dirInfo = await FileSystem.getInfoAsync(OBJECTS_DIR);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(OBJECTS_DIR, { intermediates: true });
            }

            // Save the first layer's image as an object
            const timestamp = Date.now();
            const fileName = `object_${timestamp}.png`;
            const destPath = OBJECTS_DIR + fileName;

            await FileSystem.copyAsync({
                from: layers[0].uri,
                to: destPath,
            });

            Alert.alert(
                t('objectSaved' as any) || 'Object Saved! 🎨',
                '',
                [{ text: t('ok' as any) || 'OK' }]
            );
        } catch (error) {
            console.error('Save object error:', error);
            Alert.alert(
                t('error' as any) || 'Error',
                t('objectSaveError' as any) || 'Failed to save object',
                [{ text: t('ok' as any) || 'OK' }]
            );
        }
    };

    // Save project
    const saveProject = async () => {
        if (!canvasRef.current) return;

        setIsSaving(true);

        try {
            const dirInfo = await FileSystem.getInfoAsync(PROJECTS_DIR);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(PROJECTS_DIR, { intermediates: true });
            }

            const uri = await captureRef(canvasRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile',
            });

            const now = new Date();
            const timestamp = now.toISOString()
                .replace(/[-:]/g, '')
                .replace('T', '_')
                .slice(0, 15);
            const fileName = `project_${timestamp}.png`;
            const destPath = PROJECTS_DIR + fileName;

            await FileSystem.copyAsync({
                from: uri,
                to: destPath,
            });

            await FileSystem.deleteAsync(uri, { idempotent: true });

            Alert.alert(
                t('saveSuccess' as any) || 'Project Saved! 🎉',
                `${t('savedTo' as any) || 'Saved to'}: ${fileName}`,
                [
                    {
                        text: t('goHome' as any) || 'Go Home',
                        onPress: () => router.replace('/'),
                    },
                    {
                        text: t('continueEditing' as any) || 'Continue Editing',
                        style: 'cancel',
                    },
                ]
            );
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert(
                t('error' as any) || 'Error',
                t('saveError' as any) || 'Failed to save project. Please try again.',
                [{ text: t('ok' as any) || 'OK' }]
            );
        } finally {
            setIsSaving(false);
        }
    };

    // Show gesture info alert
    const showGestureInfo = () => {
        Alert.alert(
            t('editorTitle' as any) || 'Editor',
            `• ${t('dragToMove' as any) || 'Drag to move'}\n• ${t('pinchToResize' as any) || 'Pinch to resize'}\n• ${t('rotateGesture' as any) || 'Rotate'}`,
            [{ text: t('ok' as any) || 'OK' }]
        );
    };

    // Background options
    const backgroundOptions: { mode: BackgroundMode; color: string; icon: string }[] = [
        { mode: 'white', color: '#FFFFFF', icon: 'sun.max.fill' },
        { mode: 'black', color: '#000000', icon: 'moon.fill' },
        { mode: 'checkerboard', color: '#CCCCCC', icon: 'square.grid.2x2' },
        { mode: 'bluescreen', color: '#0047AB', icon: 'drop.fill' },
        { mode: 'greenscreen', color: '#00B140', icon: 'leaf.fill' },
    ];

    return (
        <GestureHandlerRootView style={styles.gestureRoot}>
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => router.back()}
                    >
                        <IconSymbol name="arrow.left" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <ThemedText type="subtitle" style={styles.headerTitle}>
                            {t('editorTitle' as any) || 'Editor'}
                        </ThemedText>
                        <TouchableOpacity onPress={showGestureInfo} style={styles.infoButton}>
                            <IconSymbol name="info.circle" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[styles.sizeButton, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => setShowSizeModal(true)}
                    >
                        <IconSymbol name="aspectratio" size={16} color={colors.primary} />
                        <ThemedText style={[styles.sizeButtonText, { color: colors.text }]}>
                            {canvasSize === 'custom'
                                ? `${currentCanvasSize.width}x${currentCanvasSize.height}`
                                : (t(currentCanvasSize.label as any) || canvasSize)}
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Canvas Area */}
                <ScrollView
                    contentContainerStyle={styles.canvasScrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.canvasContainer}>
                        <View
                            ref={canvasRef}
                            style={[
                                styles.canvas,
                                getBackgroundStyle(),
                                {
                                    width: currentCanvasSize.width,
                                    height: currentCanvasSize.height
                                }
                            ]}
                            collapsable={false}
                        >
                            {renderCheckerboard()}
                            {/* Background Image */}
                            {backgroundMode === 'image' && backgroundImageUri && (
                                <Image
                                    source={{ uri: backgroundImageUri }}
                                    style={StyleSheet.absoluteFill}
                                    resizeMode="cover"
                                />
                            )}
                            {/* Render each layer with its own independent gestures */}
                            {layers.map((layer) => (
                                <DraggableLayer
                                    key={layer.id}
                                    uri={layer.uri}
                                    size={currentCanvasSize.width}
                                    isActive={activeLayerId === layer.id}
                                    onSelect={() => setActiveLayerId(layer.id)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Background Selection Panel */}
                    <View style={[styles.backgroundPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <ThemedText style={[styles.panelLabel, { color: colors.textSecondary }]}>
                            {t('selectBackground' as any) || 'Background'}
                        </ThemedText>
                        <View style={styles.backgroundOptions}>
                            {backgroundOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.mode}
                                    style={[
                                        styles.backgroundOption,
                                        { backgroundColor: option.color },
                                        backgroundMode === option.mode && {
                                            borderWidth: 3,
                                            borderColor: colors.primary,
                                        },
                                    ]}
                                    onPress={() => setBackgroundMode(option.mode)}
                                >
                                    {option.mode === 'checkerboard' && (
                                        <View style={styles.miniCheckerboard}>
                                            <View style={[styles.miniSquare, { backgroundColor: '#FFF' }]} />
                                            <View style={[styles.miniSquare, { backgroundColor: '#CCC' }]} />
                                            <View style={[styles.miniSquare, { backgroundColor: '#CCC' }]} />
                                            <View style={[styles.miniSquare, { backgroundColor: '#FFF' }]} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                            {/* Background Image Option */}
                            <TouchableOpacity
                                style={[
                                    styles.backgroundOption,
                                    { backgroundColor: colors.backgroundSecondary },
                                    backgroundMode === 'image' && {
                                        borderWidth: 3,
                                        borderColor: colors.primary,
                                    },
                                ]}
                                onPress={pickBackgroundImage}
                            >
                                <IconSymbol name="photo" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Layer Controls Panel */}
                    {layers.length > 0 && (
                        <View style={[styles.backgroundPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <ThemedText style={[styles.panelLabel, { color: colors.textSecondary }]}>
                                {t('layerControls' as any) || 'Layer Controls'} ({layers.length})
                            </ThemedText>
                            <View style={styles.layerControlsRow}>
                                <TouchableOpacity
                                    style={[styles.layerControlButton, { backgroundColor: colors.backgroundSecondary }]}
                                    onPress={sendLayerBackward}
                                    disabled={!activeLayerId}
                                >
                                    <IconSymbol name="arrow.down" size={16} color={activeLayerId ? colors.text : colors.textSecondary} />
                                    <ThemedText style={[styles.layerControlText, { color: activeLayerId ? colors.text : colors.textSecondary }]}>
                                        {t('sendBackward' as any) || 'Back'}
                                    </ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.layerControlButton, { backgroundColor: colors.backgroundSecondary }]}
                                    onPress={bringLayerForward}
                                    disabled={!activeLayerId}
                                >
                                    <IconSymbol name="arrow.up" size={16} color={activeLayerId ? colors.text : colors.textSecondary} />
                                    <ThemedText style={[styles.layerControlText, { color: activeLayerId ? colors.text : colors.textSecondary }]}>
                                        {t('bringForward' as any) || 'Front'}
                                    </ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.layerControlButton, { backgroundColor: '#FF4444' }]}
                                    onPress={deleteActiveLayer}
                                    disabled={!activeLayerId}
                                >
                                    <IconSymbol name="trash" size={16} color="#FFFFFF" />
                                    <ThemedText style={[styles.layerControlText, { color: '#FFFFFF' }]}>
                                        {t('deleteLayer' as any) || 'Delete'}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Action Toolbar */}
                <View style={[styles.actionToolbar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={addFromGallery}
                    >
                        <IconSymbol name="photo.badge.plus" size={20} color={colors.primary} />
                        <ThemedText style={[styles.actionButtonText, { color: colors.text }]}>
                            {t('addFromGallery' as any) || 'Add Image'}
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => {
                            loadSavedObjects();
                            setShowObjectsModal(true);
                        }}
                    >
                        <IconSymbol name="square.stack.3d.up" size={20} color={colors.success} />
                        <ThemedText style={[styles.actionButtonText, { color: colors.text }]}>
                            {t('addPreviousObjects' as any) || 'Add Object'}
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Bottom Buttons */}
                <View style={styles.bottomButtons}>
                    <TouchableOpacity
                        style={[styles.secondaryButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                        onPress={saveAsObject}
                    >
                        <IconSymbol name="square.and.arrow.down.on.square" size={18} color={colors.primary} />
                        <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>
                            {t('saveAsObject' as any) || 'Save as Object'}
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            { backgroundColor: isSaving ? colors.textSecondary : colors.success },
                        ]}
                        onPress={saveProject}
                        disabled={isSaving}
                        activeOpacity={0.8}
                    >
                        {isSaving ? (
                            <>
                                <ActivityIndicator color="#FFFFFF" size="small" />
                                <ThemedText style={styles.saveButtonText}>
                                    {t('saving' as any) || 'Saving...'}
                                </ThemedText>
                            </>
                        ) : (
                            <>
                                <IconSymbol name="square.and.arrow.down" size={18} color="#FFFFFF" />
                                <ThemedText style={styles.saveButtonText}>
                                    {t('saveProject' as any) || 'Save Project'}
                                </ThemedText>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Size Selection Modal */}
                <Modal
                    visible={showSizeModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowSizeModal(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowSizeModal(false)}
                    >
                        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                            <ThemedText type="subtitle" style={styles.modalTitle}>
                                {t('pageSize' as any) || 'Canvas Size'}
                            </ThemedText>
                            {(['small', 'medium', 'large'] as const).map((size) => (
                                <TouchableOpacity
                                    key={size}
                                    style={[
                                        styles.sizeOption,
                                        { borderColor: colors.border },
                                        canvasSize === size && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                                    ]}
                                    onPress={() => {
                                        setCanvasSize(size);
                                        setShowSizeModal(false);
                                    }}
                                >
                                    <ThemedText style={{ color: canvasSize === size ? colors.primary : colors.text }}>
                                        {t(CANVAS_SIZES[size].label as any) || size}
                                    </ThemedText>
                                    <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                                        {CANVAS_SIZES[size].width} x {CANVAS_SIZES[size].height}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}

                            {/* Custom Size Option */}
                            <View style={[styles.customSizeContainer, { borderColor: canvasSize === 'custom' ? colors.primary : colors.border }]}>
                                <ThemedText style={{ color: canvasSize === 'custom' ? colors.primary : colors.text, marginBottom: 10 }}>
                                    {t('customSize' as any) || 'Custom'}
                                </ThemedText>
                                <View style={styles.customSizeInputs}>
                                    <View style={styles.customSizeInputWrapper}>
                                        <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                            {t('width' as any) || 'Width'}
                                        </ThemedText>
                                        <TextInput
                                            style={[styles.customSizeInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                                            value={customCanvasWidth}
                                            onChangeText={setCustomCanvasWidth}
                                            keyboardType="number-pad"
                                            placeholder="100-800"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                    </View>
                                    <ThemedText style={{ color: colors.textSecondary }}>x</ThemedText>
                                    <View style={styles.customSizeInputWrapper}>
                                        <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                            {t('height' as any) || 'Height'}
                                        </ThemedText>
                                        <TextInput
                                            style={[styles.customSizeInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                                            value={customCanvasHeight}
                                            onChangeText={setCustomCanvasHeight}
                                            keyboardType="number-pad"
                                            placeholder="100-800"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[styles.applyButton, { backgroundColor: colors.primary }]}
                                    onPress={applyCustomCanvasSize}
                                >
                                    <ThemedText style={styles.applyButtonText}>
                                        {t('apply' as any) || 'Apply'}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Saved Objects Modal */}
                <Modal
                    visible={showObjectsModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowObjectsModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.objectsModalContent, { backgroundColor: colors.card }]}>
                            <View style={styles.modalHeader}>
                                <ThemedText type="subtitle">
                                    {t('addPreviousObjects' as any) || 'Add Object'}
                                </ThemedText>
                                <TouchableOpacity onPress={() => setShowObjectsModal(false)}>
                                    <IconSymbol name="xmark" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                            {savedObjects.length === 0 ? (
                                <View style={styles.emptyObjects}>
                                    <IconSymbol name="square.stack.3d.up" size={48} color={colors.textSecondary} />
                                    <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>
                                        {t('noSavedObjects' as any) || 'No saved objects'}
                                    </ThemedText>
                                </View>
                            ) : (
                                <FlatList
                                    data={savedObjects}
                                    numColumns={3}
                                    keyExtractor={(item) => item.uri}
                                    contentContainerStyle={styles.objectsGrid}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[styles.objectItem, { borderColor: colors.border }]}
                                            onPress={() => addSavedObject(item)}
                                        >
                                            <Image
                                                source={{ uri: item.uri }}
                                                style={styles.objectThumbnail}
                                                resizeMode="contain"
                                            />
                                        </TouchableOpacity>
                                    )}
                                />
                            )}
                        </View>
                    </View>
                </Modal>
            </ThemedView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    gestureRoot: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoButton: {
        padding: 4,
    },
    sizeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    sizeButtonText: {
        fontSize: 13,
        fontWeight: '500',
    },
    canvasScrollContainer: {
        flexGrow: 1,
        paddingVertical: 16,
    },
    canvasContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    canvas: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    checkerboardContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    draggableLayer: {
        position: 'absolute',
    },
    layerImage: {
        borderRadius: 4,
    },
    activeLayerBorder: {
        borderWidth: 2,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
    },
    backgroundPanel: {
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    panelLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 10,
    },
    backgroundOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    backgroundOption: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 12,
        maxWidth: 56,
        maxHeight: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    miniCheckerboard: {
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderRadius: 10,
        overflow: 'hidden',
    },
    miniSquare: {
        width: '50%',
        height: '50%',
    },
    actionToolbar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
        borderTopWidth: 1,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    bottomButtons: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 32,
        paddingTop: 8,
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: SCREEN_WIDTH - 60,
        borderRadius: 20,
        padding: 20,
    },
    modalTitle: {
        textAlign: 'center',
        marginBottom: 16,
    },
    sizeOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    objectsModalContent: {
        width: SCREEN_WIDTH - 40,
        maxHeight: '70%',
        borderRadius: 20,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyObjects: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    objectsGrid: {
        paddingTop: 8,
    },
    objectItem: {
        flex: 1,
        aspectRatio: 1,
        margin: 4,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        backgroundColor: '#F0F0F0',
    },
    objectThumbnail: {
        width: '100%',
        height: '100%',
    },
    layerControlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    layerControlButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 10,
        borderRadius: 10,
    },
    layerControlText: {
        fontSize: 12,
        fontWeight: '600',
    },
    customSizeContainer: {
        marginTop: 8,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    customSizeInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    customSizeInputWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    inputLabel: {
        fontSize: 11,
        marginBottom: 4,
    },
    customSizeInput: {
        width: '100%',
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        textAlign: 'center',
        fontSize: 14,
    },
    applyButton: {
        marginTop: 12,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
});
