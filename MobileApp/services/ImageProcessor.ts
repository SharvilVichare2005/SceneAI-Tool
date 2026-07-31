/**
 * ImageProcessor Service
 * Provides image manipulation utilities using @shopify/react-native-skia
 * Primary use case: Creating transparent PNG cutouts from SVG segmentation paths
 */

import {
    Skia,
    ClipOp,
    type SkPath,
    type SkImage,
} from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import { EncodingType } from 'expo-file-system/legacy';

/**
 * Creates a cutout (masked image) from an original image using an SVG path.
 * The SVG path from Moondream is normalized (0-1), and this function scales
 * it to match the actual pixel dimensions of the image.
 *
 * @param imageUri - Local URI of the source image
 * @param svgPath - Normalized SVG path string (coordinates in 0-1 range)
 * @returns Promise<string> - URI of the saved cutout PNG in cache directory
 */
export async function createCutout(
    imageUri: string,
    svgPath: string
): Promise<string> {
    // Load the image
    const imageData = await loadImageFromUri(imageUri);
    if (!imageData) {
        throw new Error('Failed to load image from URI');
    }

    const { image, width, height } = imageData;

    // Parse and scale the SVG path to match image dimensions
    const originalPath = Skia.Path.MakeFromSVGString(svgPath);
    if (!originalPath) {
        throw new Error('Failed to parse SVG path string');
    }

    // Scale the normalized (0-1) path to actual pixel dimensions
    const scaledPath = scalePathToPixels(originalPath, width, height);

    // Create a surface with the same dimensions as the image
    const surface = Skia.Surface.Make(width, height);
    if (!surface) {
        throw new Error('Failed to create Skia surface');
    }

    const canvas = surface.getCanvas();

    // Clear the canvas with transparent background
    canvas.clear(Skia.Color('transparent'));

    // Save canvas state before applying clip
    canvas.save();

    // Apply the scaled path as a clip mask
    canvas.clipPath(scaledPath, ClipOp.Intersect, true);

    // Draw the image (only visible parts within the clip will be rendered)
    const paint = Skia.Paint();
    canvas.drawImage(image, 0, 0, paint);

    // Restore canvas state
    canvas.restore();

    // Flush and get the resulting image
    surface.flush();
    const resultImage = surface.makeImageSnapshot();

    if (!resultImage) {
        throw new Error('Failed to create image snapshot');
    }

    // Encode the result as PNG
    const pngData = resultImage.encodeToBase64();
    if (!pngData) {
        throw new Error('Failed to encode image to PNG');
    }

    // Save to cache directory
    const outputUri = await savePngToCache(pngData);

    return outputUri;
}

/**
 * Creates a cutout with a bounding box context.
 * When the path is relative to a bounding box (like Moondream's segment results),
 * this function scales the path within that bounding box context.
 *
 * @param imageUri - Local URI of the source image
 * @param svgPath - Normalized SVG path string within bbox context
 * @param bbox - Bounding box with normalized coordinates { x_min, y_min, x_max, y_max }
 * @returns Promise<string> - URI of the saved cutout PNG
 */
export async function createCutoutWithBbox(
    imageUri: string,
    svgPath: string,
    bbox: { x_min: number; y_min: number; x_max: number; y_max: number }
): Promise<string> {
    const imageData = await loadImageFromUri(imageUri);
    if (!imageData) {
        throw new Error('Failed to load image from URI');
    }

    const { image, width, height } = imageData;

    // Calculate pixel coordinates of the bounding box
    const boxX = bbox.x_min * width;
    const boxY = bbox.y_min * height;
    const boxW = (bbox.x_max - bbox.x_min) * width;
    const boxH = (bbox.y_max - bbox.y_min) * height;

    // Parse the SVG path
    const originalPath = Skia.Path.MakeFromSVGString(svgPath);
    if (!originalPath) {
        throw new Error('Failed to parse SVG path string');
    }

    // Scale and translate path to fit within the bounding box
    const scaledPath = scalePathToBbox(originalPath, boxX, boxY, boxW, boxH);

    // Create surface and render
    const surface = Skia.Surface.Make(width, height);
    if (!surface) {
        throw new Error('Failed to create Skia surface');
    }

    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color('transparent'));
    canvas.save();
    canvas.clipPath(scaledPath, ClipOp.Intersect, true);

    const paint = Skia.Paint();
    canvas.drawImage(image, 0, 0, paint);
    canvas.restore();

    surface.flush();
    const resultImage = surface.makeImageSnapshot();

    if (!resultImage) {
        throw new Error('Failed to create image snapshot');
    }

    const pngData = resultImage.encodeToBase64();
    if (!pngData) {
        throw new Error('Failed to encode image to PNG');
    }

    return await savePngToCache(pngData);
}

/**
 * Creates a cropped cutout containing only the segmented region.
 * This crops the result to the bounding box dimensions instead of
 * maintaining the original image size.
 *
 * @param imageUri - Local URI of the source image
 * @param svgPath - Normalized SVG path string within bbox context
 * @param bbox - Bounding box with normalized coordinates
 * @returns Promise<string> - URI of the cropped cutout PNG
 */
export async function createCroppedCutout(
    imageUri: string,
    svgPath: string,
    bbox: { x_min: number; y_min: number; x_max: number; y_max: number }
): Promise<string> {
    const imageData = await loadImageFromUri(imageUri);
    if (!imageData) {
        throw new Error('Failed to load image from URI');
    }

    const { image, width, height } = imageData;

    // Calculate pixel coordinates of the bounding box
    const boxX = bbox.x_min * width;
    const boxY = bbox.y_min * height;
    const boxW = (bbox.x_max - bbox.x_min) * width;
    const boxH = (bbox.y_max - bbox.y_min) * height;

    // Create a surface only as large as the bounding box
    const surface = Skia.Surface.Make(Math.ceil(boxW), Math.ceil(boxH));
    if (!surface) {
        throw new Error('Failed to create Skia surface');
    }

    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color('transparent'));

    // Parse and scale the path relative to the cropped canvas
    const originalPath = Skia.Path.MakeFromSVGString(svgPath);
    if (!originalPath) {
        throw new Error('Failed to parse SVG path string');
    }

    // Scale path to cropped dimensions (no offset needed, path starts at 0,0)
    const scaledPath = scalePathToPixels(originalPath, boxW, boxH);

    canvas.save();
    canvas.clipPath(scaledPath, ClipOp.Intersect, true);

    // Draw the image offset so the bbox region aligns with canvas origin
    const paint = Skia.Paint();
    canvas.drawImage(image, -boxX, -boxY, paint);
    canvas.restore();

    surface.flush();
    const resultImage = surface.makeImageSnapshot();

    if (!resultImage) {
        throw new Error('Failed to create image snapshot');
    }

    const pngData = resultImage.encodeToBase64();
    if (!pngData) {
        throw new Error('Failed to encode image to PNG');
    }

    return await savePngToCache(pngData);
}

// ============================================================================
// Internal Helper Functions
// ============================================================================

/**
 * Loads an image from a local URI and returns the SkImage with dimensions.
 */
async function loadImageFromUri(
    uri: string
): Promise<{ image: SkImage; width: number; height: number } | null> {
    try {
        // Read the image file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: EncodingType.Base64,
        });

        // Create SkImage from base64 data
        const skData = Skia.Data.fromBase64(base64);
        if (!skData) {
            console.error('Failed to create Skia data from base64');
            return null;
        }

        const image = Skia.Image.MakeImageFromEncoded(skData);
        if (!image) {
            console.error('Failed to decode image');
            return null;
        }

        return {
            image,
            width: image.width(),
            height: image.height(),
        };
    } catch (error) {
        console.error('Error loading image:', error);
        return null;
    }
}

/**
 * Scales a normalized (0-1) SkPath to actual pixel dimensions.
 * Uses Skia's native matrix transformation.
 */
function scalePathToPixels(
    path: SkPath,
    width: number,
    height: number
): SkPath {
    const scaledPath = path.copy();
    const matrix = Skia.Matrix();
    matrix.scale(width, height);
    scaledPath.transform(matrix);
    return scaledPath;
}

/**
 * Scales and translates a normalized path to fit within a bounding box.
 * Uses Skia's native matrix transformation for offset + scale.
 * 
 * Matrix order: scale first (converts 0-1 to pixel coords), 
 * then postTranslate (shifts to bbox position in pixel space)
 */
function scalePathToBbox(
    path: SkPath,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
): SkPath {
    const scaledPath = path.copy();
    const matrix = Skia.Matrix();
    // Scale normalized coordinates to bounding box dimensions
    matrix.scale(width, height);
    // Then translate to the bounding box position (in pixel coordinates)
    matrix.postTranslate(offsetX, offsetY);
    scaledPath.transform(matrix);
    return scaledPath;
}

/**
 * Saves base64 PNG data to the cache directory and returns the file URI.
 */
async function savePngToCache(base64Data: string): Promise<string> {
    const filename = `cutout_${Date.now()}.png`;
    const outputUri = `${FileSystem.cacheDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(outputUri, base64Data, {
        encoding: EncodingType.Base64,
    });

    return outputUri;
}

/**
 * Utility function to get image dimensions without loading the full image.
 * Useful for preview calculations.
 */
export async function getImageDimensions(
    uri: string
): Promise<{ width: number; height: number } | null> {
    const imageData = await loadImageFromUri(uri);
    if (!imageData) {
        return null;
    }
    return {
        width: imageData.width,
        height: imageData.height,
    };
}

/**
 * Deletes a cached cutout file.
 */
export async function deleteCachedCutout(uri: string): Promise<void> {
    try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) {
            await FileSystem.deleteAsync(uri);
        }
    } catch (error) {
        console.error('Error deleting cached cutout:', error);
    }
}
