"use client";

import type { Region, ImageLayout } from "@/types/api";

interface Props {
  boxes: Region[];
  imageLayout?: ImageLayout;
  objectName?: string;
  highlightedIndex?: number | null;
}

const COLORS = [
  "#F59E0B", // Neon Amber (ultra visible against landscapes/dark cars)
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#3B82F6", // Blue
  "#EF4444", // Red
];

export function BoundingBoxOverlay({
  boxes,
  imageLayout,
  objectName,
  highlightedIndex,
}: Props) {
  if (!boxes || boxes.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {boxes.map((box, i) => {
        const color = COLORS[i % COLORS.length];
        const isHighlighted = highlightedIndex === i;

        // Clean user display label
        let displayLabel = box.label || objectName || `Object #${i + 1}`;
        if (objectName && objectName.trim() && objectName.toLowerCase() !== "all") {
          displayLabel = objectName.trim();
        }

        const confText = box.confidence
          ? `${Math.round(box.confidence * 100)}%`
          : "";

        // Percentage-based geometry ensures 100% rock-solid alignment
        const leftPercent = Math.max(0, Math.min(100, box.x_min * 100));
        const topPercent = Math.max(0, Math.min(100, box.y_min * 100));
        const widthPercent = Math.max(1.5, (box.x_max - box.x_min) * 100);
        const heightPercent = Math.max(1.5, (box.y_max - box.y_min) * 100);

        const isNearTop = box.y_min < 0.08;

        return (
          <div
            key={i}
            className={`absolute rounded-md transition-transform duration-200 ${
              isHighlighted ? "scale-105 z-30" : ""
            }`}
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
              minWidth: "24px",
              minHeight: "20px",
              border: `3px solid ${color}`,
              backgroundColor: `${color}30`,
              boxShadow: isHighlighted
                ? `0 0 0 2px #fff, 0 0 26px ${color}, inset 0 0 16px ${color}60`
                : `0 0 0 1px rgba(0,0,0,0.6), 0 0 16px ${color}90, inset 0 0 10px ${color}40`,
            }}
          >
            {/* Top / Bottom Label Pin */}
            <div
              className={`absolute flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-xs font-black text-white shadow-xl ${
                isNearTop ? "top-full mt-1.5 left-0" : "-top-7 left-0"
              }`}
              style={{
                backgroundColor: color,
                boxShadow: "0 3px 10px rgba(0,0,0,0.6)",
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              <span className="capitalize">{displayLabel}</span>
              {confText && (
                <span className="rounded bg-black/50 px-1 py-0.2 text-[10px] font-bold text-white">
                  {confText}
                </span>
              )}
            </div>

            {/* Corner Reticles */}
            <div
              className="absolute -left-1 -top-1 h-3 w-3 rounded-tl border-l-2 border-t-2"
              style={{ borderColor: "#fff" }}
            />
            <div
              className="absolute -right-1 -top-1 h-3 w-3 rounded-tr border-r-2 border-t-2"
              style={{ borderColor: "#fff" }}
            />
            <div
              className="absolute -bottom-1 -left-1 h-3 w-3 rounded-bl border-b-2 border-l-2"
              style={{ borderColor: "#fff" }}
            />
            <div
              className="absolute -bottom-1 -right-1 h-3 w-3 rounded-br border-b-2 border-r-2"
              style={{ borderColor: "#fff" }}
            />

            {/* Aiming Reticle for Small Objects */}
            {widthPercent < 15 && heightPercent < 15 && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default BoundingBoxOverlay;
