"use client";

import type { Region, ImageLayout } from "@/types/api";

interface Props {
  svgPath: string;
  bbox: Region;
  imageWidth: number;
  imageHeight: number;
  imageLayout: ImageLayout;
}

export function SegmentOverlay({
  svgPath,
  bbox,
  imageWidth,
  imageHeight,
  imageLayout,
}: Props) {
  if (!svgPath) return null;

  const boxX = imageLayout.x + bbox.x_min * imageLayout.width;
  const boxY = imageLayout.y + bbox.y_min * imageLayout.height;
  const boxW = (bbox.x_max - bbox.x_min) * imageLayout.width;
  const boxH = (bbox.y_max - bbox.y_min) * imageLayout.height;

  return (
    <svg
      width={imageWidth}
      height={imageHeight}
      className="pointer-events-none absolute inset-0"
    >
      <g transform={`translate(${boxX} ${boxY}) scale(${boxW} ${boxH})`}>
        <path
          d={svgPath}
          className="fill-brand/40 stroke-brand"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
  );
}

export default SegmentOverlay;
