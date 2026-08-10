// Shared API types — mirror the original MobileApp/services/moondreamApi.ts
// so the frontend overlay + analysis logic ports cleanly.

export interface Region {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  label?: string;
  confidence?: number;
}

export interface Point {
  x: number;
  y: number;
  label?: string;
}

export interface ModelInfo {
  model: string;
  seg_model: string;
  options: string[];
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

export type CaptionLength = "short" | "normal" | "long";

export type AnalysisMode = "caption" | "query" | "detect" | "point" | "segment";

export interface ImageLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}
