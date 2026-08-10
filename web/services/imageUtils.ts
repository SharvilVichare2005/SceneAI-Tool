/**
 * Browser-side image utilities — replacements for the RN Skia / expo-file-system
 * helpers in MobileApp/services/ImageProcessor.ts:
 *  - fileToDataUrl: load + downscale an uploaded file to a base64 data URL
 *  - createCutoutWithBbox: clip the image by the (bbox-relative, normalized)
 *    segmentation SVG path and export a transparent PNG data URL
 *  - getRenderedImageLayout: object-contain letterbox math (mirrors the RN page)
 */

import type { ImageLayout, Region } from "@/types/api";

export interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

export async function fileToDataUrl(
  file: File | Blob,
  maxDim = 1280
): Promise<LoadedImage> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(bitmapUrl);
    let { width, height } = img;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    return { dataUrl, width, height };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Create a transparent-background cutout from a segmentation result.
 * The svgPath coords are normalized 0-1 RELATIVE to the bbox; the bbox is
 * normalized 0-1 over the full image (same contract as Moondream).
 */
export async function createCutoutWithBbox(
  imageSrc: string,
  svgPath: string,
  bbox: Region
): Promise<string> {
  const img = await loadImage(imageSrc);
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  const boxX = bbox.x_min * W;
  const boxY = bbox.y_min * H;
  const boxW = Math.max((bbox.x_max - bbox.x_min) * W, 1);
  const boxH = Math.max((bbox.y_max - bbox.y_min) * H, 1);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  // path is normalized within bbox -> transform into that space, then clip
  ctx.translate(boxX, boxY);
  ctx.scale(boxW, boxH);
  const path = new Path2D(svgPath);
  ctx.clip(path);
  // reset transform so the image draws in full-image space; clip persists
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(img, 0, 0);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

/**
 * Given a container size and the image's true aspect ratio, compute the
 * letterboxed render rect (object-contain) — same math as the RN page.
 */
export function getRenderedImageLayout(
  containerWidth: number,
  containerHeight: number,
  imageAspectRatio: number
): ImageLayout {
  const containerAspectRatio = containerWidth / containerHeight;
  if (containerAspectRatio > imageAspectRatio) {
    const renderHeight = containerHeight;
    const renderWidth = containerHeight * imageAspectRatio;
    return {
      x: (containerWidth - renderWidth) / 2,
      y: 0,
      width: renderWidth,
      height: renderHeight,
    };
  }
  const renderWidth = containerWidth;
  const renderHeight = containerWidth / imageAspectRatio;
  return {
    x: 0,
    y: (containerHeight - renderHeight) / 2,
    width: renderWidth,
    height: renderHeight,
  };
}
