"use client";

import type { Region, ImageLayout } from "@/types/api";

interface Props {
  boxes: Region[];
  imageLayout: ImageLayout;
  objectName?: string;
}

const COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
];

export function BoundingBoxOverlay({ boxes, imageLayout, objectName }: Props) {
  if (boxes.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0">
      {boxes.map((box, i) => {
        const left = imageLayout.x + box.x_min * imageLayout.width;
        const top = imageLayout.y + box.y_min * imageLayout.height;
        const w = (box.x_max - box.x_min) * imageLayout.width;
        const h = (box.y_max - box.y_min) * imageLayout.height;
        const color = COLORS[i % COLORS.length];
        return (
          <div
            key={i}
            className="absolute rounded-sm border-2"
            style={{ left, top, width: w, height: h, borderColor: color }}
          >
          <span
            className="absolute -left-0.5 -top-5 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {box.label || objectName
              ? `${box.label || objectName}${box.confidence ? ` ${(box.confidence * 100).toFixed(0)}%` : ""} ${i + 1}`
              : `#${i + 1}`}
          </span>
          </div>
        );
      })}
    </div>
  );
}

export default BoundingBoxOverlay;
