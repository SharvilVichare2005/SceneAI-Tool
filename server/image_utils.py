"""
Image utilities: base64 decoding + polygon -> normalized SVG path conversion.

The SVG path contract mirrors Moondream's /segment response:
  - bbox coords are normalized 0-1 over the FULL image
  - path coords are normalized 0-1 RELATIVE to that bbox
This is exactly what the frontend SegmentOverlay and the canvas cutout expect.
"""

import base64
import io
import numpy as np
import cv2
from PIL import Image


def decode_image(image_url: str):
    """
    Decode a base64 data-URL (or raw base64) into (PIL_RGB, numpy_BGR).
    PIL goes to BLIP (caption/query); BGR numpy goes to ultralytics, which
    internally flips BGR->RGB, so passing BGR keeps the model's colors correct.
    """
    if image_url.startswith("data:") and "," in image_url:
        b64 = image_url.split(",", 1)[1]
    else:
        b64 = image_url
    raw = base64.b64decode(b64)
    pil = Image.open(io.BytesIO(raw)).convert("RGB")
    np_rgb = np.array(pil)
    np_bgr = np_rgb[:, :, ::-1].copy()
    return pil, np_bgr


def polygon_to_svg(polygon_px, bbox_px, img_w, img_h, epsilon_frac=0.004):
    """
    Convert a pixel-space polygon + pixel-space bbox into the Moondream-style
    {path, bbox} contract: path normalized 0-1 within bbox, bbox normalized 0-1
    over the full image.
    """
    x1, y1, x2, y2 = [float(v) for v in bbox_px]
    bw = max(x2 - x1, 1.0)
    bh = max(y2 - y1, 1.0)

    pts = np.array(polygon_px, dtype=np.float32).reshape(-1, 1, 2)
    peri = cv2.arcLength(pts, True)
    eps = max(epsilon_frac * peri, 1.0)
    approx = cv2.approxPolyDP(pts, eps, True).reshape(-1, 2)
    if len(approx) < 3:
        approx = pts.reshape(-1, 2)
    if len(approx) > 250:
        step = max(1, len(approx) // 250)
        approx = approx[::step]

    nx0 = min(max((approx[0][0] - x1) / bw, 0.0), 1.0)
    ny0 = min(max((approx[0][1] - y1) / bh, 0.0), 1.0)
    d = "M %.5f %.5f " % (nx0, ny0)
    for x, y in approx[1:]:
        nx = min(max((x - x1) / bw, 0.0), 1.0)
        ny = min(max((y - y1) / bh, 0.0), 1.0)
        d += "L %.5f %.5f " % (nx, ny)
    d += "Z"

    bbox = {
        "x_min": x1 / img_w,
        "y_min": y1 / img_h,
        "x_max": x2 / img_w,
        "y_max": y2 / img_h,
    }
    return d, bbox
