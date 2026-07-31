/**
 * Moondream AI API Service
 * Handles all communication with Moondream Cloud API
 * API Documentation: https://moondream.ai
 */

import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

// API Configuration
const API_BASE_URL = 'https://api.moondream.ai/v1';

// Get API key from environment - for Expo, use app.json extra or Constants
const getApiKey = (): string => {
    // Try to get from Expo Constants
    const apiKey = Constants.expoConfig?.extra?.moondreamApiKey ||
        process.env.EXPO_PUBLIC_MOONDREAM_API_KEY ||
        process.env.MOONDREAM_API_KEY ||
        '';
    return apiKey;
};

// =============================================================================
// TYPES
// =============================================================================

export interface Region {
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface CaptionResponse {
    caption: string;
}

export interface QueryResponse {
    answer: string;
}

export interface DetectResponse {
    objects: Region[];
}

export interface PointResponse {
    points: Point[];
}

export interface SegmentResponse {
    path: string;
    bbox: Region;
}

export type CaptionLength = 'short' | 'normal' | 'long';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

import { Platform } from 'react-native';

/**
 * Convert image URI to base64 encoded string
 */
async function imageToBase64(imageUri: string): Promise<string> {
    try {
        if (Platform.OS === 'web') {
            if (imageUri.startsWith('data:image')) {
                return imageUri;
            }
            const response = await fetch(imageUri);
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        reject(new Error('Failed to convert blob to base64'));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } else {
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: 'base64',
            });
            return `data:image/jpeg;base64,${base64}`;
        }
    } catch (error) {
        console.error('Error converting image to base64:', error);
        throw new Error('Failed to encode image');
    }
}

/**
 * Make API request to Moondream Cloud
 * @param endpoint - API endpoint
 * @param body - Request body
 * @param customApiKey - Optional API key (if not provided, uses environment key)
 */
async function apiRequest<T>(
    endpoint: string,
    body: Record<string, unknown>,
    customApiKey?: string
): Promise<T> {
    const apiKey = customApiKey || getApiKey();

    if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error('MOONDREAM_API_KEY is not configured. Please add your API key.');
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Moondream-Auth': apiKey,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);

            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your Moondream API key.');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait and try again.');
            } else {
                throw new Error(`API request failed: ${response.status}`);
            }
        }

        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Network error. Please check your internet connection.');
    }
}

// =============================================================================
// API METHODS
// =============================================================================

/**
 * Generate a caption for an image
 * @param imageUri - Local URI of the image
 * @param length - Caption length: 'short', 'normal', or 'long'
 * @returns Caption text
 */
export async function caption(
    imageUri: string,
    length: CaptionLength = 'normal',
    customApiKey?: string
): Promise<CaptionResponse> {
    const imageBase64 = await imageToBase64(imageUri);

    return apiRequest<CaptionResponse>('/caption', {
        image_url: imageBase64,
        length,
    }, customApiKey);
}

/**
 * Ask a question about an image
 * @param imageUri - Local URI of the image
 * @param question - Question to ask about the image
 * @returns Answer text
 */
export async function query(
    imageUri: string,
    question: string,
    customApiKey?: string
): Promise<QueryResponse> {
    const imageBase64 = await imageToBase64(imageUri);

    return apiRequest<QueryResponse>('/query', {
        image_url: imageBase64,
        question,
    }, customApiKey);
}

/**
 * Detect specific objects in an image
 * @param imageUri - Local URI of the image
 * @param object - Object type to detect (e.g., 'car', 'person', 'cat')
 * @returns Array of bounding boxes (normalized 0-1)
 */
export async function detect(
    imageUri: string,
    object: string,
    customApiKey?: string
): Promise<DetectResponse> {
    const imageBase64 = await imageToBase64(imageUri);

    return apiRequest<DetectResponse>('/detect', {
        image_url: imageBase64,
        object,
    }, customApiKey);
}

/**
 * Get center point coordinates of specific objects in an image
 * @param imageUri - Local URI of the image
 * @param object - Object type to find (e.g., 'face', 'eye', 'hand')
 * @returns Array of point coordinates (normalized 0-1)
 */
export async function point(
    imageUri: string,
    object: string,
    customApiKey?: string
): Promise<PointResponse> {
    const imageBase64 = await imageToBase64(imageUri);

    return apiRequest<PointResponse>('/point', {
        image_url: imageBase64,
        object,
    }, customApiKey);
}

/**
 * Segment a specific object from an image
 * @param imageUri - Local URI of the image
 * @param object - Object type to segment (e.g., 'cat', 'dog', 'person')
 * @returns SVG path string and bounding box
 */
export async function segment(
    imageUri: string,
    object: string,
    customApiKey?: string
): Promise<SegmentResponse> {
    const imageBase64 = await imageToBase64(imageUri);

    return apiRequest<SegmentResponse>('/segment', {
        image_url: imageBase64,
        object,
    }, customApiKey);
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export const MoondreamApi = {
    caption,
    query,
    detect,
    point,
    segment,
};

export default MoondreamApi;
