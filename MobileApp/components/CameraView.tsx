/**
 * Camera View Component
 * Handles camera display and photo capture
 */

import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { CameraView as ExpoCameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface CameraViewProps {
    onPhotoTaken?: (uri: string) => void;
}

export function CameraView({ onPhotoTaken }: CameraViewProps) {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const cameraRef = useRef<ExpoCameraView>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const takePhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                if (photo?.uri) {
                    setCapturedPhoto(photo.uri);
                    onPhotoTaken?.(photo.uri);
                }
            } catch (error) {
                console.error('Failed to take photo:', error);
            }
        }
    };

    const retakePhoto = () => {
        setCapturedPhoto(null);
    };

    if (capturedPhoto) {
        return (
            <View style={styles.container}>
                <Image
                    source={{ uri: capturedPhoto }}
                    style={styles.preview}
                    contentFit="cover"
                />
                <View style={[styles.controls, { backgroundColor: colors.overlay }]}>
                    <TouchableOpacity
                        style={[styles.retakeButton, { backgroundColor: colors.error }]}
                        onPress={retakePhoto}
                    >
                        <IconSymbol name="arrow.counterclockwise" size={24} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Tekrar Çek</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ExpoCameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
            >
                <View style={styles.cameraOverlay}>
                    <View style={styles.topControls}>
                        <TouchableOpacity
                            style={[styles.flipButton, { backgroundColor: colors.overlay }]}
                            onPress={toggleCameraFacing}
                        >
                            <IconSymbol name="camera.rotate" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomControls}>
                        <TouchableOpacity
                            style={styles.captureButton}
                            onPress={takePhoto}
                        >
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ExpoCameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'space-between',
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
    },
    flipButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomControls: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
    },
    preview: {
        flex: 1,
    },
    controls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 30,
        alignItems: 'center',
    },
    retakeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
