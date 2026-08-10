"use client";

import { Type, HelpCircle, Scan, MapPin, Scissors } from "lucide-react";
import type { AnalysisMode } from "@/types/api";

interface ModeSelectorProps {
  selectedMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  disabled?: boolean;
}

const MODES: { key: AnalysisMode; label: string; icon: typeof Type; hint: string }[] = [
  { key: "caption", label: "Caption", icon: Type, hint: "BLIP — describe the image" },
  { key: "query", label: "Query", icon: HelpCircle, hint: "BLIP-VQA — ask a question" },
  { key: "detect", label: "Detect", icon: Scan, hint: "YOLOv8 — bounding boxes" },
  { key: "point", label: "Point", icon: MapPin, hint: "YOLOv8 — object centers" },
  { key: "segment", label: "Segment", icon: Scissors, hint: "YOLOv8-seg — mask + cutout" },
];

export function ModeSelector({ selectedMode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((m) => {
        const Icon = m.icon;
        const active = selectedMode === m.key;
        return (
          <button
            key={m.key}
            disabled={disabled}
            onClick={() => onModeChange(m.key)}
            title={m.hint}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50 ${
              active
                ? "border-brand bg-brand text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Icon size={16} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

export default ModeSelector;
