import 'dotenv/config';

export default {
    expo: {
        owner: "byrkhns-organization",
        name: "MobileApp",
        slug: "labellingapp",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "mobileapp",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            infoPlist: {
                NSCameraUsageDescription: "Fotoğraf çekmek için kamera erişimi gereklidir.",
                NSPhotoLibraryUsageDescription: "Fotoğraf seçmek için galeri erişimi gereklidir."
            }
        },
        android: {
            package: "com.byrkhns.labellingapp",
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/android-icon-foreground.png",
                backgroundImage: "./assets/images/android-icon-background.png",
                monochromeImage: "./assets/images/android-icon-monochrome.png"
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            permissions: [
                "android.permission.CAMERA",
                "android.permission.READ_EXTERNAL_STORAGE",
                "android.permission.WRITE_EXTERNAL_STORAGE"
            ]
        },
        web: {
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff",
                    dark: {
                        backgroundColor: "#000000"
                    }
                }
            ],
            [
                "expo-camera",
                {
                    cameraPermission: "Fotoğraf çekmek için kamera erişimi gereklidir."
                }
            ],
            [
                "expo-image-picker",
                {
                    photosPermission: "Fotoğraf seçmek için galeri erişimi gereklidir."
                }
            ]
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: true
        },
        extra: {
            moondreamApiKey: process.env.MOONDREAM_API_KEY,
            eas: {
                projectId: "b3c63914-c4e7-4bdb-b327-41621fd71040",
                owner: "byrkhns-organization"
            }
        }
    }
};
