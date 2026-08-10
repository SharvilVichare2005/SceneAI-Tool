"use client";

import type { Point, ImageLayout } from "@/types/api";

interface Props {
  points: Point[];
  imageLayout: ImageLayout;
}

const COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
];
const SIZE = 28;

export function PointMarkerOverlay({ points, imageLayout }: Props) {
  if (points.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0">
      {points.map((p, i) => {
        const left = imageLayout.x + p.x * imageLayout.width - SIZE / 2;
        const top = imageLayout.y + p.y * imageLayout.height - SIZE / 2;
        const color = COLORS[i % COLORS.length];
        return (
          <div
            key={i}
            className="absolute grid place-items-center rounded-full text-white shadow-md"
            style={{
              left,
              top,
              width: SIZE,
              height: SIZE,
              backgroundColor: color,
              fontSize: 12,
              fontWeight: 800,
            }}
            title={p.label}
          >
            {i + 1}
            {p.label && (
              <span
                className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold capitalize"
                style={{ backgroundColor: color }}
              >
                {p.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PointMarkerOverlay;
