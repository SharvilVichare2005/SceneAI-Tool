/**
 * usePermissions Hook
 * Manages camera and media library permissions for the app
 */

import { useState, useCallback, useEffect } from 'react';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface PermissionState {
    camera: PermissionStatus;
    mediaLibrary: PermissionStatus;
}

interface UsePermissionsReturn {
    permissions: PermissionState;
    requestCameraPermission: () => Promise<boolean>;
    requestMediaLibraryPermission: () => Promise<boolean>;
    checkPermissions: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
    const [permissions, setPermissions] = useState<PermissionState>({
        camera: 'undetermined',
        mediaLibrary: 'undetermined',
    });

    // Check current permission status
    const checkPermissions = useCallback(async () => {
        try {
            const [cameraStatus, mediaStatus] = await Promise.all([
                Camera.getCameraPermissionsAsync(),
                ImagePicker.getMediaLibraryPermissionsAsync(),
            ]);

            setPermissions({
                camera: cameraStatus.granted ? 'granted' : cameraStatus.canAskAgain ? 'undetermined' : 'denied',
                mediaLibrary: mediaStatus.granted ? 'granted' : mediaStatus.canAskAgain ? 'undetermined' : 'denied',
            });
        } catch (error) {
            console.error('Error checking permissions:', error);
        }
    }, []);

    // Request camera permission
    const requestCameraPermission = useCallback(async (): Promise<boolean> => {
        try {
            const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();

            if (status === 'granted') {
                setPermissions(prev => ({ ...prev, camera: 'granted' }));
                return true;
            }

            if (!canAskAgain) {
                setPermissions(prev => ({ ...prev, camera: 'denied' }));
                Alert.alert(
                    'Kamera İzni Gerekli',
                    'Kamera kullanabilmek için ayarlardan izin vermeniz gerekmektedir.',
                    [
                        { text: 'İptal', style: 'cancel' },
                        { text: 'Ayarları Aç', onPress: () => Linking.openSettings() },
                    ]
                );
                return false;
            }

            setPermissions(prev => ({ ...prev, camera: 'undetermined' }));
            return false;
        } catch (error) {
            console.error('Error requesting camera permission:', error);
            return false;
        }
    }, []);

    // Request media library permission
    const requestMediaLibraryPermission = useCallback(async (): Promise<boolean> => {
        try {
            const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status === 'granted') {
                setPermissions(prev => ({ ...prev, mediaLibrary: 'granted' }));
                return true;
            }

            if (!canAskAgain) {
                setPermissions(prev => ({ ...prev, mediaLibrary: 'denied' }));
                Alert.alert(
                    'Galeri İzni Gerekli',
                    'Galeriyi kullanabilmek için ayarlardan izin vermeniz gerekmektedir.',
                    [
                        { text: 'İptal', style: 'cancel' },
                        { text: 'Ayarları Aç', onPress: () => Linking.openSettings() },
                    ]
                );
                return false;
            }

            setPermissions(prev => ({ ...prev, mediaLibrary: 'undetermined' }));
            return false;
        } catch (error) {
            console.error('Error requesting media library permission:', error);
            return false;
        }
    }, []);

    // Check permissions on mount
    useEffect(() => {
        checkPermissions();
    }, [checkPermissions]);

    return {
        permissions,
        requestCameraPermission,
        requestMediaLibraryPermission,
        checkPermissions,
    };
}
