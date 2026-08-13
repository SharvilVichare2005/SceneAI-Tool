/**
 * Inference API service — with Enterprise Security Shield.
 *
 * Routes inference requests through the secure Next.js BFF proxy (/api/inference/...)
 * by default so internal backend IPs, ports, and raw tracebacks are never exposed to
 * end-user browser sessions.
 */

import type {
  CaptionResponse,
  CaptionLength,
  DetectResponse,
  PointResponse,
  QueryResponse,
  Region,
  Point,
  SegmentResponse,
  ModelInfo,
} from "@/types/api";
import { sanitizeErrorMessage } from "@/lib/security";

export type {
  CaptionResponse,
  CaptionLength,
  DetectResponse,
  PointResponse,
  QueryResponse,
  Region,
  Point,
  SegmentResponse,
  ModelInfo,
};

// Default to the secure Next.js BFF proxy route
export const DEFAULT_BASE_URL = "/api/inference";

async function imageToBase64(imageUri: string): Promise<string> {
  if (imageUri.startsWith("data:image")) return imageUri;
  const resp = await fetch(imageUri);
  const blob = await resp.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Failed to encode image for processing"));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function resolveUrl(baseUrl: string, endpoint: string): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanEp = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // If using the proxy, e.g. /api/inference + /caption -> /api/inference/caption
  if (cleanBase === "/api/inference" || cleanBase.includes("/api/inference")) {
    return `${cleanBase}${cleanEp}`;
  }
  return `${cleanBase}${cleanEp}`;
}

async function apiRequest<T>(
  baseUrl: string,
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = resolveUrl(baseUrl, endpoint);
  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "SceneAI-SecureClient",
      },
      body: JSON.stringify(body),
    });
  } catch (netErr) {
    throw new Error(
      "Cannot reach AI inference engine. Please ensure the backend server is running."
    );
  }

  if (!resp.ok) {
    let msg = `Request failed (Status ${resp.status})`;
    try {
      const j = await resp.json();
      if (j.error) {
        msg = j.error;
      } else if (j.detail) {
        msg = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
      }
    } catch {
      /* use fallback */
    }
    if (resp.status === 404) {
      msg = "Inference endpoint unavailable. Please check model configuration.";
    }
    throw new Error(sanitizeErrorMessage(msg));
  }
  return (await resp.json()) as T;
}

export async function caption(
  imageUri: string,
  length: CaptionLength = "normal",
  baseUrl: string = DEFAULT_BASE_URL,
  model?: string,
  modeTier: "fast" | "balanced" | "high" = "high"
): Promise<CaptionResponse> {
  const image = await imageToBase64(imageUri);
  return apiRequest<CaptionResponse>(baseUrl, "/caption", {
    image_url: image,
    length,
    model: model || "",
    mode_tier: modeTier,
  });
}

export async function query(
  imageUri: string,
  question: string,
  baseUrl: string = DEFAULT_BASE_URL,
  model?: string,
  modeTier: "fast" | "balanced" | "high" = "high"
): Promise<QueryResponse> {
  const image = await imageToBase64(imageUri);
  return apiRequest<QueryResponse>(baseUrl, "/query", {
    image_url: image,
    question,
    model: model || "",
    mode_tier: modeTier,
  });
}

export async function detect(
  imageUri: string,
  object: string,
  baseUrl: string = DEFAULT_BASE_URL,
  model?: string,
  modeTier: "fast" | "balanced" | "high" = "high"
): Promise<DetectResponse> {
  const image = await imageToBase64(imageUri);
  return apiRequest<DetectResponse>(baseUrl, "/detect", {
    image_url: image,
    object,
    model: model || "",
    mode_tier: modeTier,
  });
}

export async function point(
  imageUri: string,
  object: string,
  baseUrl: string = DEFAULT_BASE_URL,
  model?: string,
  modeTier: "fast" | "balanced" | "high" = "high"
): Promise<PointResponse> {
  const image = await imageToBase64(imageUri);
  return apiRequest<PointResponse>(baseUrl, "/point", {
    image_url: image,
    object,
    model: model || "",
    mode_tier: modeTier,
  });
}

export async function segment(
  imageUri: string,
  object: string,
  baseUrl: string = DEFAULT_BASE_URL,
  model?: string,
  modeTier: "fast" | "balanced" | "high" = "high"
): Promise<SegmentResponse> {
  const image = await imageToBase64(imageUri);
  return apiRequest<SegmentResponse>(baseUrl, "/segment", {
    image_url: image,
    object,
    model: model || "",
    mode_tier: modeTier,
  });
}

export async function fetchClasses(
  baseUrl: string = DEFAULT_BASE_URL
): Promise<string[]> {
  try {
    const url = resolveUrl(baseUrl, "/classes");
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const j = await resp.json();
    return (j.classes as string[]) ?? [];
  } catch {
    return [];
  }
}

export async function checkHealth(
  baseUrl: string = DEFAULT_BASE_URL
): Promise<boolean> {
  try {
    const url = resolveUrl(baseUrl, "/health");
    const resp = await fetch(url);
    return resp.ok;
  } catch {
    return false;
  }
}

export async function fetchModel(
  baseUrl: string = DEFAULT_BASE_URL
): Promise<ModelInfo | null> {
  try {
    const url = resolveUrl(baseUrl, "/model");
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return (await resp.json()) as ModelInfo;
  } catch {
    return null;
  }
}

export async function setModel(
  model: string,
  baseUrl: string = DEFAULT_BASE_URL
): Promise<ModelInfo> {
  const url = resolveUrl(baseUrl, "/model");
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  if (!resp.ok) {
    let msg = `Model update failed (Status ${resp.status})`;
    try {
      const j = await resp.json();
      if (j.error) msg = j.error;
      else if (j.detail) msg = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* fallback */
    }
    throw new Error(sanitizeErrorMessage(msg));
  }
  return (await resp.json()) as ModelInfo;
}

export const InferenceApi = {
  caption,
  query,
  detect,
  point,
  segment,
  fetchClasses,
  checkHealth,
  fetchModel,
  setModel,
};

export default InferenceApi;
