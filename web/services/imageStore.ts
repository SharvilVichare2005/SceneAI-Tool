/**
 * Tiny sessionStorage-backed store for passing the selected image between
 * pages (home/camera/video -> analysis -> editor) without URL bloat, since
 * data URLs are too large for query params.
 */

import type { LoadedImage } from "@/services/imageUtils";

const IMAGE_KEY = "app:selectedImage";
const CUTOUT_KEY = "app:cutout";
const ORIGINAL_KEY = "app:originalImage";

export function setSelectedImage(img: LoadedImage) {
  sessionStorage.setItem(IMAGE_KEY, JSON.stringify(img));
}
export function getSelectedImage(): LoadedImage | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(IMAGE_KEY);
  return raw ? (JSON.parse(raw) as LoadedImage) : null;
}
export function clearSelectedImage() {
  sessionStorage.removeItem(IMAGE_KEY);
}

export function setCutout(cutoutDataUrl: string, originalDataUrl: string) {
  sessionStorage.setItem(CUTOUT_KEY, cutoutDataUrl);
  sessionStorage.setItem(ORIGINAL_KEY, originalDataUrl);
}
export function getCutout(): { cutout: string; original: string } | null {
  if (typeof window === "undefined") return null;
  const cutout = sessionStorage.getItem(CUTOUT_KEY);
  const original = sessionStorage.getItem(ORIGINAL_KEY);
  if (!cutout || !original) return null;
  return { cutout, original };
}
export function clearCutout() {
  sessionStorage.removeItem(CUTOUT_KEY);
  sessionStorage.removeItem(ORIGINAL_KEY);
}
