/**
 * Inference API service — local drop-in replacement for the original
 * Moondream cloud client (MobileApp/services/moondreamApi.ts).
 *
 * Same method signatures + return shapes; only the transport changes:
 * instead of https://api.moondream.ai it calls the local Python backend
 * (FastAPI + YOLO + BLIP) at the configured base URL.
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

export const DEFAULT_BASE_URL = "http://localhost:8000";

async function imageToBase64(imageUri: string): Promise<string> {
  if (imageUri.startsWith("data:image")) return imageUri;
  const resp = await fetch(imageUri);
  const blob = await resp.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Failed to encode image"));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function apiRequest<T>(
  baseUrl: string,
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, "")}${endpoint}`;
  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Cannot reach inference server. Start the Python backend (`uvicorn main:app --port 8000`)."
    );
  }

  if (!resp.ok) {
    let msg = `Request failed: ${resp.status}`;
    try {
      const j = await resp.json();
      if (j.detail) {
        msg = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
      }
    } catch {
      /* keep default */
    }
    if (resp.status === 404) {
      msg = `Endpoint not found at ${url}. Is the backend running?`;
    }
    throw new Error(msg);
  }
  return (await resp.json()) as T;
}

export async function caption(
  imageUri: string,
  length: CaptionLength = "normal",
  baseUrl: string = DEFAULT_BASE_URL
): Promise<CaptionResponse> {
  const image = await imageToBase64(imageUri);
  return apiRequest<CaptionResponse>(baseUrl, "/caption", {
    image_url: image,
    length,
  });
}

export async function query(
  imageUri: string,
  question: string,
  baseUrl: string = DEFAULT_BASE_URL
): Promise<QueryResponse> {
  const image = await imageToBase64(imageUri);
  return apiRequest<QueryResponse>(baseUrl, "/query", {
    image_url: image,
    question,
  });
}

export async function detect(
  imageUri: string,
  object: string,
  baseUrl: string = DEFAULT_BASE_URL
): Promise<DetectResponse> {
  const image = await imageToBase64(imageUri);
  return apiRequest<DetectResponse>(baseUrl, "/detect", {
    image_url: image,
    object,
  });
}

export async function point(
  imageUri: string,
  object: string,
  baseUrl: string = DEFAULT_BASE_URL
): Promise<PointResponse> {
  const image = await imageToBase64(imageUri);
  return apiRequest<PointResponse>(baseUrl, "/point", {
    image_url: image,
    object,
  });
}

export async function segment(
  imageUri: string,
  object: string,
  baseUrl: string = DEFAULT_BASE_URL
): Promise<SegmentResponse> {
  const image = await imageToBase64(imageUri);
  return apiRequest<SegmentResponse>(baseUrl, "/segment", {
    image_url: image,
    object,
  });
}

export async function fetchClasses(
  baseUrl: string = DEFAULT_BASE_URL
): Promise<string[]> {
  try {
    const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/classes`);
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
    const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/health`);
    return resp.ok;
  } catch {
    return false;
  }
}

export async function fetchModel(
  baseUrl: string = DEFAULT_BASE_URL
): Promise<ModelInfo | null> {
  try {
    const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/model`);
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
  const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/model`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  if (!resp.ok) {
    let msg = `Request failed: ${resp.status}`;
    try {
      const j = await resp.json();
      if (j.detail) msg = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  return (await resp.json()) as ModelInfo;
}

export const InferenceApi = {
  caption,
  query,
  detect,
  point,
  segment,
  fetchModel,
  setModel,
};

export default InferenceApi;
