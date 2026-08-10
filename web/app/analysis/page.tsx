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

export default function AnalysisPage() {
  const router = useRouter();
  const { baseUrl, status } = useServer();

  // sessionStorage is browser-only. Start with the same value on the server and
  // client, then hydrate the selected image after mount to avoid a React mismatch.
  const [image, setImage] = useState<ReturnType<typeof getSelectedImage>>(null);
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>("caption");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultType>({});
  const [inputText, setInputText] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [detectAll, setDetectAll] = useState(false);
  const [captionLength, setCaptionLength] = useState<CaptionLength>("normal");
  const [isProcessingCutout, setIsProcessingCutout] = useState(false);

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

  // Load after mount and refresh on focus (in case home set a new one).
  useEffect(() => {
    setImage(getSelectedImage());
    const onFocus = () => setImage(getSelectedImage());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // clear results when mode changes
  useEffect(() => {
    setResult({});
    setError(null);
    setDetectAll(false);
  }, [selectedMode]);

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
          const r = await InferenceApi.caption(image.dataUrl, captionLength, baseUrl);
          setResult({ caption: r.caption });
          break;
        }
        case "query": {
          if (!inputText.trim()) {
            setError("Please enter a question");
            break;
          }
          const r = await InferenceApi.query(image.dataUrl, inputText.trim(), baseUrl);
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
            baseUrl
          );
          setResult({ objects: r.objects });
          break;
        }
        case "point": {
          if (!selectedClass) {
            setError("Please pick a class to locate");
            break;
          }
          const r = await InferenceApi.point(image.dataUrl, selectedClass, baseUrl);
          setResult({ points: r.points });
          break;
        }
        case "segment": {
          if (!selectedClass) {
            setError("Please pick a class to segment");
            break;
          }
          const r = await InferenceApi.segment(image.dataUrl, selectedClass, baseUrl);
          setResult({ segment: { path: r.path, bbox: r.bbox } });
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inference error");
    } finally {
      setIsLoading(false);
    }
  }, [image, selectedMode, inputText, selectedClass, captionLength, baseUrl]);

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

  const renderInputArea = () => {
    if (selectedMode === "caption") {
      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Caption length</p>
          <div className="flex gap-2">
            {(["short", "normal", "long"] as CaptionLength[]).map((len) => (
              <button
                key={len}
                onClick={() => setCaptionLength(len)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold capitalize transition ${
                  captionLength === len
                    ? "border-brand bg-brand text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
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
          <p className="text-xs font-medium text-slate-500">Question</p>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            rows={2}
            placeholder="e.g. What is in this image? How many people are there?"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      );
    }

    // detect / point / segment -> closed-set class picker
    const label =
      selectedMode === "detect"
        ? "Object class to detect"
        : selectedMode === "point"
        ? "Object class to locate"
        : "Object class to segment";
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {selectedMode === "detect" && (
          <button
            type="button"
            onClick={() => setDetectAll((v) => !v)}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              detectAll
                ? "border-brand bg-brand text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {detectAll ? "✓ Detecting all objects" : "Detect all objects (auto-label)"}
          </button>
        )}
        {!detectAll && (
          <ClassPicker
            value={selectedClass}
            onChange={setSelectedClass}
            disabled={isLoading}
          />
        )}
        <p className="text-xs text-slate-400">
          YOLO is closed-set (COCO 80 classes). "House" isn't one of them — use
          "All objects" to see everything the model can label, or pick a class
          like car, person, truck, chair…
        </p>
      </div>
    );
  };

  const renderResult = () => {
    if (error) {
      return (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      );
    }
    if (result.caption) {
      return <ResultCard icon={<Type size={18} />} text={result.caption} />;
    }
    if (result.answer) {
      return <ResultCard icon={<HelpCircle size={18} />} text={result.answer} />;
    }
    if (result.objects) {
      return (
        <ResultCard
          icon={<SquareDashed size={18} />}
          text={`${result.objects.length} object${result.objects.length === 1 ? "" : "s"} found`}
        />
      );
    }
    if (result.points) {
      return (
        <ResultCard
          icon={<MapPin size={18} />}
          text={`${result.points.length} point${result.points.length === 1 ? "" : "s"} found`}
        />
      );
    }
    if (result.segment) {
      return (
        <div className="space-y-3">
          <ResultCard icon={<Scissors size={18} />} text="Segmentation complete" />
          <button
            onClick={handleCreateCutout}
            disabled={isProcessingCutout || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {isProcessingCutout ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Processing cutout…
              </>
            ) : (
              <>
                <Scissors size={18} /> Create Sticker & Edit
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
        />
      );
    }
    if (result.points && result.points.length > 0) {
      return <PointMarkerOverlay points={result.points} imageLayout={imageLayout} />;
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
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Sparkles size={28} />
          </div>
          <h2 className="text-xl font-bold">No image selected</h2>
          <p className="text-slate-500">
            Upload an image from the home page to start analyzing.
          </p>
          <Link
            href="/"
            className="rounded-xl bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-600"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Analysis</h1>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand"
          >
            <ArrowLeft size={16} /> New image
          </Link>
        </div>

        {status === "offline" && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle size={16} /> Inference server is offline. Start it with{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
              uvicorn main:app --port 8000
            </code>
          </div>
        )}

        {/* Image + overlays */}
        <div
          ref={containerRef}
          className="relative mx-auto w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900"
          style={{ aspectRatio: `${image.width} / ${image.height}` }}
        >
          <img
            src={image.dataUrl}
            alt="analysis target"
            className="h-full w-full object-contain"
          />
          {renderOverlays()}
        </div>

        {/* Mode selector */}
        <ModeSelector
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          disabled={isLoading}
        />

        {/* Input area */}
        {renderInputArea()}

        {/* Analyze */}
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Analyzing…
            </>
          ) : (
            <>
              <Sparkles size={18} /> Analyze
            </>
          )}
        </button>

        {/* Result */}
        {renderResult()}
      </div>
    </div>
  );
}

function ResultCard({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <span className="text-brand">{icon}</span>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}
