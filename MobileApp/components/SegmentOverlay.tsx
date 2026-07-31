/**
 * SegmentOverlay Component
 * Renders SVG segmentation path over an image
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Region } from '@/services/moondreamApi';

interface SegmentOverlayProps {
    svgPath: string;
    bbox: Region;
    imageWidth: number;
    imageHeight: number;
    imageLayout: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export function SegmentOverlay({
    svgPath,
    bbox,
    imageWidth,
    imageHeight,
    imageLayout,
}: SegmentOverlayProps) {
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    if (!svgPath) {
        return null;
    }

    // Calculate pixel coordinates of the bounding box
    const boxX = imageLayout.x + bbox.x_min * imageLayout.width;
    const boxY = imageLayout.y + bbox.y_min * imageLayout.height;
    const boxW = (bbox.x_max - bbox.x_min) * imageLayout.width;
    const boxH = (bbox.y_max - bbox.y_min) * imageLayout.height;

    // Scale the SVG path relative to the bounding box dimensions
    // The path coordinates are normalized (0-1) within the bounding box context
    const scaledPath = scalePathToImage(svgPath, {
        x: boxX,
        y: boxY,
        width: boxW,
        height: boxH
    });

    return (
        <Animated.View
            entering={FadeIn.duration(500)}
            style={[styles.container, { width: imageWidth, height: imageHeight }]}
        >
            <Svg width={imageWidth} height={imageHeight} style={styles.svg}>
                {/* Segmentation mask */}
                <Path
                    d={scaledPath}
                    fill={colors.primary}
                    fillOpacity={0.4}
                    stroke={colors.primary}
                    strokeWidth={2}
                />
                {/* Bounding box indicator - Hidden as requested */}
                {/* <Rect
                    x={boxX}
                    y={boxY}
                    width={boxW}
                    height={boxH}
                    fill="transparent"
                    stroke={colors.success}
                    strokeWidth={2}
                    strokeDasharray="8,4"
                /> */}
            </Svg>
        </Animated.View>
    );
}

/**
 * Scale SVG path coordinates from normalized (0-1) to image pixel dimensions
 * Handles all SVG path commands: M, L, H, V, C, S, Q, T, A, Z
 * Applies offset and scaling based on actual rendered image layout
 */
function scalePathToImage(
    path: string,
    layout: { x: number; y: number; width: number; height: number }
): string {
    // Parse path into commands and their arguments
    const commandRegex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;

    let result = '';
    let match;

    while ((match = commandRegex.exec(path)) !== null) {
        const command = match[1];
        const argsString = match[2].trim();

        // Parse numbers from args
        const numbers = argsString.match(/-?[\d.]+(?:e[-+]?\d+)?/gi);

        if (!numbers || numbers.length === 0) {
            // Commands like Z/z have no arguments
            result += command;
            continue;
        }

        const args = numbers.map(n => parseFloat(n));
        const scaledArgs: number[] = [];

        // Handle each command type based on its coordinate expectations
        switch (command.toUpperCase()) {
            case 'M': // moveto: x, y
            case 'L': // lineto: x, y
            case 'T': // smooth quadratic: x, y
                for (let i = 0; i < args.length; i += 2) {
                    scaledArgs.push(args[i] * layout.width + layout.x);
                    scaledArgs.push(args[i + 1] * layout.height + layout.y);
                }
                break;

            case 'H': // horizontal line: x
                for (let i = 0; i < args.length; i++) {
                    scaledArgs.push(args[i] * layout.width + layout.x);
                }
                break;

            case 'V': // vertical line: y
                for (let i = 0; i < args.length; i++) {
                    scaledArgs.push(args[i] * layout.height + layout.y);
                }
                break;

            case 'C': // cubic bezier: x1, y1, x2, y2, x, y
                for (let i = 0; i < args.length; i += 6) {
                    scaledArgs.push(args[i] * layout.width + layout.x);     // x1
                    scaledArgs.push(args[i + 1] * layout.height + layout.y); // y1
                    scaledArgs.push(args[i + 2] * layout.width + layout.x);  // x2
                    scaledArgs.push(args[i + 3] * layout.height + layout.y); // y2
                    scaledArgs.push(args[i + 4] * layout.width + layout.x);  // x
                    scaledArgs.push(args[i + 5] * layout.height + layout.y); // y
                }
                break;

            case 'S': // smooth cubic: x2, y2, x, y
            case 'Q': // quadratic bezier: x1, y1, x, y
                for (let i = 0; i < args.length; i += 4) {
                    scaledArgs.push(args[i] * layout.width + layout.x);
                    scaledArgs.push(args[i + 1] * layout.height + layout.y);
                    scaledArgs.push(args[i + 2] * layout.width + layout.x);
                    scaledArgs.push(args[i + 3] * layout.height + layout.y);
                }
                break;

            case 'A': // arc: rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y
                for (let i = 0; i < args.length; i += 7) {
                    scaledArgs.push(args[i] * layout.width);      // rx
                    scaledArgs.push(args[i + 1] * layout.height); // ry
                    scaledArgs.push(args[i + 2]);          // x-axis-rotation (no scale)
                    scaledArgs.push(args[i + 3]);          // large-arc-flag (no scale)
                    scaledArgs.push(args[i + 4]);          // sweep-flag (no scale)
                    scaledArgs.push(args[i + 5] * layout.width + layout.x);  // x
                    scaledArgs.push(args[i + 6] * layout.height + layout.y); // y
                }
                break;

            case 'Z': // close path
                break;

            default:
                // For any other commands, pass through as-is
                result += command + ' ' + argsString + ' ';
                continue;
        }

        result += command + ' ' + scaledArgs.map(n => n.toFixed(2)).join(' ') + ' ';
    }

    return result.trim();
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    svg: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
});

export default SegmentOverlay;
