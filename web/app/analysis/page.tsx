"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Scissors,
  ArrowLeft,
  Type,
  HelpCircle,
  AlertTriangle,
  SquareDashed,
  MapPin,
  Zap,
  Target,
  Brain,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ModeSelector } from "@/components/ModeSelector";
import { ClassPicker } from "@/components/ClassPicker";
import { BoundingBoxOverlay } from "@/components/BoundingBoxOverlay";
import { PointMarkerOverlay } from "@/components/PointMarkerOverlay";
import { SegmentOverlay } from "@/components/SegmentOverlay";
import InferenceApi, { type CaptionLength } from "@/services/inferenceApi";
import type {
  AnalysisMode,
  Region,
  Point as PointType,
  SegmentResponse,
} from "@/types/api";
import {
  getRenderedImageLayout,
  createCutoutWithBbox,
} from "@/services/imageUtils";
import { getSelectedImage, setCutout, clearSelectedImage } from "@/services/imageStore";
import { useServer } from "@/context/ServerContext";
import Link from "next/link";

interface ResultType {
  caption?: string;
  answer?: string;
  objects?: Region[];
  points?: PointType[];
  segment?: { path: string; bbox: Region };
}

type ModelTier = "fast" | "balanced" | "high";

interface ModelOption {
  id: string;
  name: string;
  tier: ModelTier;
  latency: string;
  accuracy: string;
  description: string;
  badge: string;
}

const MODEL_PRESETS: Record<ModelTier, ModelOption[]> = {
  fast: [
    {
      id: "yolo11n",
      name: "YOLO11 Nano",
      tier: "fast",
      latency: "~15ms",
      accuracy: "89.2% mAP",
      description: "Ultra-fast inference optimized for rapid labeling & CPU efficiency.",
      badge: "⚡ Fast",
    },
    {
      id: "yolov8n",
      name: "YOLOv8 Nano",
      tier: "fast",
      latency: "~20ms",
      accuracy: "87.5% mAP",
      description: "Lightweight CPU model for quick real-time checks.",
      badge: "⚡ Fast",
    },
  ],
  balanced: [
    {
      id: "yolo11s",
      name: "YOLO11 Small",
      tier: "balanced",
      latency: "~45ms",
      accuracy: "92.4% mAP",
      description: "Default balanced model for everyday datasets.",
      badge: "🎯 Balanced",
    },
    {
      id: "yolov8s",
      name: "YOLOv8 Small",
      tier: "balanced",
      latency: "~50ms",
      accuracy: "91.1% mAP",
      description: "Standard model with solid speed/accuracy ratio.",
      badge: "🎯 Balanced",
    },
  ],
  high: [
    {
      id: "yolo11x",
      name: "YOLO11 Extra Large (Vision Pro)",
      tier: "high",
      latency: "~140ms",
      accuracy: "96.8% mAP",
      description: "Highest precision model + Deep VQA & entity recognition.",
      badge: "🧠 High Precision",
    },
    {
      id: "yolov8x",
      name: "YOLOv8 Extra Large",
      tier: "high",
      latency: "~160ms",
      accuracy: "95.5% mAP",
      description: "Ultra accuracy for dense objects and small details.",
      badge: "🧠 High Precision",
    },
  ],
};

export default function AnalysisPage() {
  const router = useRouter();
  const { baseUrl, status } = useServer();

  const [image, setImage] = useState<ReturnType<typeof getSelectedImage>>(null);
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>("query");
  const [selectedTier, setSelectedTier] = useState<ModelTier>("high");
  const [selectedModelId, setSelectedModelId] = useState<string>("yolo11x");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultType>({});
  const [inputText, setInputText] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [detectAll, setDetectAll] = useState(false);
  const [captionLength, setCaptionLength] = useState<CaptionLength>("normal");
  const [isProcessingCutout, setIsProcessingCutout] = useState(false);
  const [copied, setCopied] = useState(false);
  const [highlightedBoxIndex, setHighlightedBoxIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      setMeasuredWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load image on mount
  useEffect(() => {
    setImage(getSelectedImage());
    const onFocus = () => setImage(getSelectedImage());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Clear results on mode change
  useEffect(() => {
    setResult({});
    setError(null);
    setDetectAll(false);
  }, [selectedMode]);

  // When tier changes, update default selected model
  const handleTierChange = (tier: ModelTier) => {
    setSelectedTier(tier);
    setSelectedModelId(MODEL_PRESETS[tier][0].id);
  };

  const aspect = image ? image.width / image.height : 1;
  const containerWidth = measuredWidth || 1;
  const containerHeight = containerWidth / aspect;
  const imageLayout = getRenderedImageLayout(
    containerWidth,
    containerHeight,
    aspect
  );

  const handleAnalyze = useCallback(async () => {
    if (!image) {
      setError("No image selected");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      switch (selectedMode) {
        case "caption": {
          const r = await InferenceApi.caption(
            image.dataUrl,
            captionLength,
            baseUrl,
            selectedModelId,
            selectedTier
          );
          setResult({ caption: r.caption });
          break;
        }
        case "query": {
          if (!inputText.trim()) {
            setError("Please enter a question about the image");
            break;
          }
          const r = await InferenceApi.query(
            image.dataUrl,
            inputText.trim(),
            baseUrl,
            selectedModelId,
            selectedTier
          );
          setResult({ answer: r.answer });
          break;
        }
        case "detect": {
          if (!detectAll && !selectedClass) {
            setError("Please pick a class to detect, or toggle “All objects”");
            break;
          }
          const r = await InferenceApi.detect(
            image.dataUrl,
            detectAll ? "" : selectedClass,
            baseUrl,
            selectedModelId,
            selectedTier
          );
          setResult({ objects: r.objects });
          break;
        }
        case "point": {
          if (!selectedClass) {
            setError("Please pick a class to locate");
            break;
          }
          const r = await InferenceApi.point(
            image.dataUrl,
            selectedClass,
            baseUrl,
            selectedModelId,
            selectedTier
          );
          setResult({ points: r.points });
          break;
        }
        case "segment": {
          if (!selectedClass) {
            setError("Please pick a class to segment");
            break;
          }
          const r = await InferenceApi.segment(
            image.dataUrl,
            selectedClass,
            baseUrl,
            selectedModelId,
            selectedTier
          );
          setResult({ segment: { path: r.path, bbox: r.bbox } });
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inference error");
    } finally {
      setIsLoading(false);
    }
  }, [
    image,
    selectedMode,
    inputText,
    selectedClass,
    detectAll,
    captionLength,
    baseUrl,
    selectedModelId,
    selectedTier,
  ]);

  const handleCreateCutout = useCallback(async () => {
    if (!image || !result.segment) return;
    setIsProcessingCutout(true);
    try {
      const cutout = await createCutoutWithBbox(
        image.dataUrl,
        result.segment.path,
        result.segment.bbox
      );
      setCutout(cutout, image.dataUrl);
      router.push("/editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create cutout");
    } finally {
      setIsProcessingCutout(false);
    }
  }, [image, result.segment, router]);

  const copyResultText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderInputArea = () => {
    if (selectedMode === "caption") {
      return (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">Caption Length</p>
          <div className="flex gap-2">
            {(["short", "normal", "long"] as CaptionLength[]).map((len) => (
              <button
                key={len}
                onClick={() => setCaptionLength(len)}
                className={`flex-1 rounded-xl border py-2.5 text-xs font-bold capitalize transition ${
                  captionLength === len
                    ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {len}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (selectedMode === "query") {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Ask any question about the image:
            </p>
            <span className="text-[11px] font-medium text-slate-400">
              e.g. &ldquo;name of the soccer player in photo&rdquo;
            </span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            rows={2}
            placeholder="e.g. name of the soccer player in photo, what team is he on, count the cars..."
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 shadow-sm"
          />
        </div>
      );
    }

    const label =
      selectedMode === "detect"
        ? "Object or Search Prompt to Detect (Type anything)"
        : selectedMode === "point"
        ? "Object or Search Prompt to Locate Points"
        : "Object or Search Prompt to Segment";

    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{label}</p>
          <span className="text-[11px] text-slate-400">Type to search or pick quick filter</span>
        </div>

        {selectedMode === "detect" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setDetectAll(true);
                setSelectedClass("");
              }}
              className={`flex-1 rounded-xl border py-2 text-xs font-bold transition ${
                detectAll && !selectedClass
                  ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {detectAll && !selectedClass ? "✓ Detecting All Objects" : "Detect All Objects"}
            </button>
            {detectAll && !selectedClass && (
              <button
                type="button"
                onClick={() => setDetectAll(false)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              >
                Specific Search
              </button>
            )}
          </div>
        )}

        <ClassPicker
          value={selectedClass}
          onChange={(val) => {
            setSelectedClass(val);
            if (val) setDetectAll(false);
          }}
          disabled={isLoading}
          placeholder={
            selectedMode === "detect"
              ? "Type object name to search (e.g. player, car, dog, bottle, chair)..."
              : selectedMode === "segment"
              ? "Type object name to segment (e.g. player, person, ball, car)..."
              : "Type object name to locate points..."
          }
        />
      </div>
    );
  };

  const renderResult = () => {
    if (error) {
      return (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      );
    }
    if (result.caption) {
      return (
        <ResultCard
          icon={<Type size={18} />}
          title="Generated Caption"
          text={result.caption}
          onCopy={() => copyResultText(result.caption!)}
          copied={copied}
        />
      );
    }
    if (result.answer) {
      return (
        <ResultCard
          icon={<HelpCircle size={18} />}
          title="Visual Intelligence Answer"
          text={result.answer}
          onCopy={() => copyResultText(result.answer!)}
          copied={copied}
        />
      );
    }
    if (result.objects) {
      return (
        <div className="space-y-3">
          <ResultCard
            icon={<SquareDashed size={18} />}
            title="Detection Results"
            text={`${result.objects.length} object${result.objects.length === 1 ? "" : "s"} identified`}
          />
          {result.objects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.objects.map((obj, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHighlightedBoxIndex(i)}
                  onMouseLeave={() => setHighlightedBoxIndex(null)}
                  onClick={() => setHighlightedBoxIndex((prev) => (prev === i ? null : i))}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                    highlightedBoxIndex === i
                      ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/50 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-violet-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  <span className="capitalize">{selectedClass && selectedClass !== "all" ? selectedClass : obj.label}</span>
                  <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-extrabold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    {Math.round((obj.confidence ?? 1) * 100)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (result.points) {
      return (
        <ResultCard
          icon={<MapPin size={18} />}
          title="Point Markers"
          text={`${result.points.length} point coordinate${result.points.length === 1 ? "" : "s"} found`}
        />
      );
    }
    if (result.segment) {
      return (
        <div className="space-y-3">
          <ResultCard
            icon={<Scissors size={18} />}
            title="Polygon Segmentation"
            text="Precise polygon boundary extracted successfully."
          />
          <button
            onClick={handleCreateCutout}
            disabled={isProcessingCutout || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {isProcessingCutout ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Processing cutout…
              </>
            ) : (
              <>
                <Scissors size={16} /> Create Cutout &amp; Edit on Canvas
              </>
            )}
          </button>
        </div>
      );
    }
    return null;
  };

  const renderOverlays = () => {
    if (result.objects && result.objects.length > 0) {
      return (
        <BoundingBoxOverlay
          boxes={result.objects}
          imageLayout={imageLayout}
          objectName={selectedClass}
          highlightedIndex={highlightedBoxIndex}
        />
      );
    }
    if (result.points && result.points.length > 0) {
      return (
        <PointMarkerOverlay
          points={result.points}
          imageLayout={imageLayout}
          objectName={selectedClass}
        />
      );
    }
    if (result.segment) {
      return (
        <SegmentOverlay
          svgPath={result.segment.path}
          bbox={result.segment.bbox}
          imageWidth={containerWidth}
          imageHeight={containerHeight}
          imageLayout={imageLayout}
        />
      );
    }
    return null;
  };

  if (!image) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] dark:bg-slate-950">
        <Navbar />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950/50">
            <Sparkles size={28} />
          </div>
          <h2 className="text-xl font-bold">No image selected for analysis</h2>
          <p className="text-xs text-slate-500">
            Upload an image from the overview or camera to start annotating.
          </p>
          <Link
            href="/"
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500"
          >
            Go to Overview
          </Link>
        </div>
      </div>
    );
  }

  const activeModelInfo = MODEL_PRESETS[selectedTier].find((m) => m.id === selectedModelId) || MODEL_PRESETS[selectedTier][0];

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Vision &amp; Annotation Studio</h1>
            <p className="text-xs text-slate-500">
              Interactive detection, segmentation &amp; VQA reasoning
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-violet-600"
          >
            <ArrowLeft size={15} /> Upload new image
          </Link>
        </div>

        {/* Image Canvas Container */}
        <div
          ref={containerRef}
          className="relative mx-auto w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-md dark:border-slate-800 dark:bg-slate-900"
          style={{ aspectRatio: `${image.width} / ${image.height}` }}
        >
          <img
            src={image.dataUrl}
            alt="analysis target"
            className="h-full w-full object-contain"
          />
          {renderOverlays()}
        </div>

        {/* Task Mode Selector Tabs */}
        <ModeSelector
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          disabled={isLoading}
        />

        {/* MODEL SELECTION & PERFORMANCE CATEGORY SWITCHER */}
        <div className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm dark:border-violet-900/50 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Cpu size={17} className="text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Select Model Category:
              </span>
            </div>

            {/* Performance Tier Tabs (Fast vs Balanced vs High Precision) */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-800">
              <button
                type="button"
                onClick={() => handleTierChange("fast")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  selectedTier === "fast"
                    ? "bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-violet-300"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Zap size={13} className="text-amber-500" />
                <span>Fast (~15ms)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTierChange("balanced")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  selectedTier === "balanced"
                    ? "bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-violet-300"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Target size={13} className="text-cyan-500" />
                <span>Balanced</span>
              </button>

              <button
                type="button"
                onClick={() => handleTierChange("high")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  selectedTier === "high"
                    ? "bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-violet-300"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Brain size={13} className="text-emerald-500" />
                <span>High Precision</span>
              </button>
            </div>
          </div>

          {/* Model Sub-Option Selector */}
          <div className="mt-3.5 flex flex-col justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Active Engine:</span>
              {MODEL_PRESETS[selectedTier].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModelId(m.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    selectedModelId === m.id
                      ? "bg-violet-600 text-white shadow-sm"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{activeModelInfo.accuracy}</span>
              <span>&bull;</span>
              <span className="text-emerald-600 font-bold dark:text-emerald-400">
                {activeModelInfo.latency}
              </span>
            </div>
          </div>
        </div>

        {/* Input Area (Prompt / Class) */}
        {renderInputArea()}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Processing with {activeModelInfo.name}…
            </>
          ) : (
            <>
              <Sparkles size={18} /> Run {selectedMode.toUpperCase()} Analysis
            </>
          )}
        </button>

        {/* Results Container */}
        {renderResult()}
      </div>
    </div>
  );
}

function ResultCard({
  icon,
  title,
  text,
  onCopy,
  copied,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-violet-600 dark:text-violet-400">{icon}</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </h3>
        </div>
        {onCopy && (
          <button
            onClick={onCopy}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        )}
      </div>
      <p className="mt-3 text-base font-semibold leading-relaxed text-slate-900 dark:text-white">
        {text}
      </p>
    </div>
  );
}
