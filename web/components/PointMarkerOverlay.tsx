"use client";

import type { Point, ImageLayout } from "@/types/api";

interface Props {
  points: Point[];
  imageLayout?: ImageLayout;
  objectName?: string;
}

const COLORS = [
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#3B82F6", // Blue
  "#EF4444", // Red
];

export function PointMarkerOverlay({ points, imageLayout, objectName }: Props) {
  if (!points || points.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* SVG Layer for Leader Lines and Arrowheads */}
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          {COLORS.map((c, idx) => (
            <marker
              key={idx}
              id={`arrowhead-${idx}`}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 8 4, 0 8" fill={c} />
            </marker>
          ))}
        </defs>

        {points.map((p, i) => {
          const color = COLORS[i % COLORS.length];

          // Point percentage coordinates
          const px = Math.max(2, Math.min(98, p.x * 100));
          const py = Math.max(2, Math.min(98, p.y * 100));

          // Calculate leader line offset (angle up-right by default, or adapt if near top/right edge)
          const isNearRight = px > 75;
          const isNearTop = py < 20;

          const offsetX = isNearRight ? -6 : 6; // %
          const offsetY = isNearTop ? 6 : -6;   // %

          const labelX = px + offsetX;
          const labelY = py + offsetY;

          return (
            <g key={`svg-leader-${i}`}>
              {/* Pulsing Target Ring at the exact point */}
              <circle
                cx={`${px}%`}
                cy={`${py}%`}
                r="7"
                fill="none"
                stroke={color}
                strokeWidth="2"
                className="animate-ping opacity-75"
              />
              <circle
                cx={`${px}%`}
                cy={`${py}%`}
                r="4.5"
                fill={color}
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Leader Line from Label Box pointing to the exact point */}
              <line
                x1={`${labelX}%`}
                y1={`${labelY}%`}
                x2={`${px}%`}
                y2={`${py}%`}
                stroke={color}
                strokeWidth="2.5"
                strokeDasharray="4 2"
                markerEnd={`url(#arrowhead-${i % COLORS.length})`}
              />
            </g>
          );
        })}
      </svg>

      {/* HTML Callout Badges with Arrow Pointer & Object Label */}
      {points.map((p, i) => {
        const color = COLORS[i % COLORS.length];

        let displayLabel = p.label || objectName || `Point #${i + 1}`;
        if (objectName && objectName.trim() && objectName.toLowerCase() !== "all") {
          displayLabel = objectName.trim();
        }

        const px = Math.max(2, Math.min(98, p.x * 100));
        const py = Math.max(2, Math.min(98, p.y * 100));

        const isNearRight = px > 75;
        const isNearTop = py < 20;

        const labelX = px + (isNearRight ? -6 : 6);
        const labelY = py + (isNearTop ? 6 : -6);

        return (
          <div
            key={`callout-${i}`}
            className="absolute -translate-y-1/2 flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-black text-white shadow-2xl transition-transform duration-200"
            style={{
              left: `${labelX}%`,
              top: `${labelY}%`,
              transform: isNearRight ? "translate(-100%, -50%)" : "translate(0%, -50%)",
              backgroundColor: "rgba(15, 23, 42, 0.92)",
              borderColor: color,
              boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 14px ${color}80`,
              backdropFilter: "blur(6px)",
            }}
          >
            {/* Number Pin Tag */}
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-white shadow"
              style={{ backgroundColor: color }}
            >
              {i + 1}
            </span>

            {/* Object Label Name with Arrow indicator */}
            <div className="flex items-center gap-1.5">
              <span className="capitalize tracking-wide text-white drop-shadow">
                {displayLabel}
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white/90"
                style={{ backgroundColor: `${color}50` }}
              >
                TARGET
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PointMarkerOverlay;
