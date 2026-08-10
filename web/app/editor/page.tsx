"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  RotateCcw,
  ArrowLeft,
  Palette,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { getCutout, clearCutout } from "@/services/imageStore";
import Link from "next/link";

const BACKGROUNDS = [
  "transparent",
  "#ffffff",
  "#000000",
  "#6C5CE7",
  "#10b981",
  "#f43f5e",
];

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

export default function EditorPage() {
  const router = useRouter();
  const [cutout, setCutout] = useState<string | null>(null);
  const [bg, setBg] = useState("transparent");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = getCutout();
    if (!c) return;
    setCutout(c.cutout);
  }, []);

  // mouse-wheel zoom (non-passive so preventDefault works)
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => clampZoom(z * (e.deltaY > 0 ? 0.9 : 1.1)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!cutout) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
          <h2 className="text-xl font-bold">No cutout to edit</h2>
          <p className="text-slate-500">
            Run segmentation on an image first, then tap “Create Sticker & Edit”.
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

  const download = () => {
    const a = document.createElement("a");
    a.href = cutout;
    a.download = `sticker-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sticker Editor</h1>
          <Link
            href="/analysis"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand"
          >
            <ArrowLeft size={16} /> Back to analysis
          </Link>
        </div>

        {/* Preview */}
        <div
          ref={previewRef}
          className="relative grid min-h-[320px] touch-none place-items-center overflow-hidden rounded-2xl border border-slate-200 p-6 dark:border-slate-800"
          style={{
            backgroundColor: bg === "transparent" ? undefined : bg,
            backgroundImage:
              bg === "transparent"
                ? "linear-gradient(45deg,#cbd5e1 25%,transparent 25%,transparent 75%,#cbd5e1 75%),linear-gradient(45deg,#cbd5e1 25%,transparent 25%,transparent 75%,#cbd5e1 75%)"
                : undefined,
            backgroundSize: bg === "transparent" ? "24px 24px" : undefined,
            backgroundPosition: bg === "transparent" ? "0 0,12px 12px" : undefined,
            cursor: zoom > 1 ? "grab" : "default",
          }}
          onPointerDown={(e) => {
            dragRef.current = {
              startX: e.clientX,
              startY: e.clientY,
              panX: pan.x,
              panY: pan.y,
            };
          }}
          onPointerMove={(e) => {
            const d = dragRef.current;
            if (!d) return;
            setPan({
              x: d.panX + (e.clientX - d.startX),
              y: d.panY + (e.clientY - d.startY),
            });
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          onPointerLeave={() => {
            dragRef.current = null;
          }}
        >
          <img
            src={cutout}
            alt="cutout sticker"
            className="max-h-[60vh] max-w-full select-none object-contain"
            draggable={false}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center",
              transition: zoom > 1 ? "transform 60ms linear" : undefined,
            }}
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setZoom((z) => clampZoom(z / 1.25))}
            title="Zoom out"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ZoomOut size={18} />
          </button>
          <span className="w-16 text-center text-sm font-bold tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => clampZoom(z * 1.25))}
            title="Zoom in"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={resetView}
            title="Reset zoom"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Maximize size={18} />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400">
          Scroll to zoom · drag to pan
        </p>

        {/* Background picker */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Palette size={14} /> Background
          </p>
          <div className="flex flex-wrap gap-2">
            {BACKGROUNDS.map((b) => (
              <button
                key={b}
                onClick={() => setBg(b)}
                className={`h-9 w-9 rounded-lg border-2 transition ${
                  bg === b ? "border-brand" : "border-slate-200 dark:border-slate-700"
                }`}
                style={{
                  backgroundColor: b === "transparent" ? "#e2e8f0" : b,
                  backgroundImage:
                    b === "transparent"
                      ? "linear-gradient(45deg,#94a3b8 25%,transparent 25%,transparent 75%,#94a3b8 75%)"
                      : undefined,
                  backgroundSize: b === "transparent" ? "10px 10px" : undefined,
                }}
                title={b}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={download}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-bold text-white hover:bg-brand-600"
          >
            <Download size={18} /> Download PNG
          </button>
          <button
            onClick={() => {
              clearCutout();
              router.push("/");
            }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw size={18} /> New
          </button>
        </div>
      </div>
    </div>
  );
}
