"""
Model manager: lazy-loaded singletons for YOLO (detect + segment) and
BLIP (caption + VQA). All inference runs on CPU.

  - YOLOv8 / YOLO11      -> /detect, /point   (closed-set, COCO 80 classes)
  - <model>-seg          -> /segment          (closed-set, COCO 80 classes)
  - BLIP caption         -> /caption          (image -> text, NLP generation)
  - BLIP-VQA             -> /query            (image + question -> answer, NLP)

The detection model is hot-swappable at runtime via POST /model (no restart
needed). Default is YOLOv8s (balanced). For the highest accuracy on arbitrary
images pick "yolov8x" or "yolo11x"; for speed pick "yolov8n". Set the
YOLO_MODEL env var to change the default before startup. Weights download
automatically on first use (ultralytics & HuggingFace).

NOTE: ultralytics assumes numpy inputs are BGR and flips them to RGB
internally (engine/predictor.py preprocess). We therefore pass BGR arrays
here so the model sees the correct colors.
"""

import os
import threading

import numpy as np

DETECT_MODELS = [
    "yolov8n",
    "yolov8s",
    "yolov8m",
    "yolov8l",
    "yolov8x",
    "yolo11n",
    "yolo11s",
    "yolo11m",
    "yolo11l",
    "yolo11x",
]


class ModelManager:
    def __init__(self):
        self._lock = threading.Lock()
        self._detect_model = os.environ.get("YOLO_MODEL", "yolov8s").strip().lower()
        if self._detect_model not in DETECT_MODELS:
            self._detect_model = "yolov8s"
        self._detect = None
        self._detect_name = None
        self._seg = None
        self._seg_name = None
        self._cap_proc = None
        self._cap_model = None
        self._vqa_proc = None
        self._vqa_model = None

    # -- loaders ------------------------------------------------------------
    def _load_detect(self):
        if self._detect is None or self._detect_name != self._detect_model:
            with self._lock:
                if self._detect is None or self._detect_name != self._detect_model:
                    from ultralytics import YOLO

                    name = self._detect_model
                    print(f"[models] loading {name} (detect) ...")
                    self._detect = YOLO(f"{name}.pt")
                    self._detect_name = name
        return self._detect

    def _load_seg(self):
        if self._seg is None or self._seg_name != self._seg_model:
            with self._lock:
                if self._seg is None or self._seg_name != self._seg_model:
                    from ultralytics import YOLO

                    name = self._seg_model
                    print(f"[models] loading {name} (segment) ...")
                    self._seg = YOLO(f"{name}.pt")
                    self._seg_name = name
        return self._seg

    def _load_caption(self):
        if self._cap_model is None:
            with self._lock:
                if self._cap_model is None:
                    from transformers import (
                        BlipProcessor,
                        BlipForConditionalGeneration,
                    )
                    print("[models] loading BLIP caption ...")
                    self._cap_proc = BlipProcessor.from_pretrained(
                        "Salesforce/blip-image-captioning-base"
                    )
                    self._cap_model = BlipForConditionalGeneration.from_pretrained(
                        "Salesforce/blip-image-captioning-base"
                    )
        return self._cap_proc, self._cap_model

    def _load_vqa(self):
        if self._vqa_model is None:
            with self._lock:
                if self._vqa_model is None:
                    from transformers import BlipProcessor, BlipForQuestionAnswering
                    print("[models] loading BLIP-VQA ...")
                    self._vqa_proc = BlipProcessor.from_pretrained(
                        "Salesforce/blip-vqa-base"
                    )
                    self._vqa_model = BlipForQuestionAnswering.from_pretrained(
                        "Salesforce/blip-vqa-base"
                    )
        return self._vqa_proc, self._vqa_model

    # -- model switching ----------------------------------------------------
    @property
    def _seg_model(self):
        return self._detect_model + "-seg"

    def set_model(self, model):
        """Hot-swap the detection (+ segment) model at runtime. No restart."""
        model = str(model).strip().lower()
        if model not in DETECT_MODELS:
            raise ValueError(
                f"Unknown model '{model}'. Options: {', '.join(DETECT_MODELS)}"
            )
        if model != self._detect_model:
            with self._lock:
                self._detect_model = model
                self._detect = None
                self._detect_name = None
                self._seg = None
                self._seg_name = None
            print(
                f"[models] switched to {model} (detect) / {model}-seg (segment)"
            )
        return self.model_info()

    def model_info(self):
        return {
            "model": self._detect_model,
            "seg_model": self._detect_model + "-seg",
            "options": list(DETECT_MODELS),
        }

    # -- public API ---------------------------------------------------------
    def coco_names(self):
        return self._load_detect().names

    def detect(self, img_np, class_name="", conf=0.2):
        """
        Return normalized Region dicts (+ label + confidence).
        class_name "" or "all" -> return every detection across all 80 classes;
        otherwise filter to that one class (case-insensitive).
        """
        d = self._load_detect()
        res = d(img_np, conf=conf, verbose=False)[0]
        names = d.names
        H, W = res.orig_shape
        match_all = class_name is None or str(class_name).strip().lower() in ("", "all")
        out = []
        for i, cls in enumerate(res.boxes.cls.tolist()):
            name = names[int(cls)]
            if not match_all and name.lower() != str(class_name).strip().lower():
                continue
            x1, y1, x2, y2 = res.boxes.xyxy[i].tolist()
            out.append(
                {
                    "x_min": x1 / W,
                    "y_min": y1 / H,
                    "x_max": x2 / W,
                    "y_max": y2 / H,
                    "label": name,
                    "confidence": round(float(res.boxes.conf[i].item()), 3),
                }
            )
        return out, (W, H)

    def points(self, img_np, class_name="", conf=0.2):
        boxes, _ = self.detect(img_np, class_name, conf)
        pts = []
        for b in boxes:
            pts.append(
                {
                    "x": (b["x_min"] + b["x_max"]) / 2,
                    "y": (b["y_min"] + b["y_max"]) / 2,
                    "label": b.get("label"),
                }
            )
        return pts

    def segment(self, img_np, class_name, conf=0.2):
        """Return (polygon_px, bbox_px, (W,H)) for the largest matching instance."""
        d = self._load_seg()
        res = d(img_np, conf=conf, verbose=False)[0]
        if res.masks is None:
            return None
        names = d.names
        H, W = res.orig_shape
        best = None
        best_area = 0.0
        for i, cls in enumerate(res.boxes.cls.tolist()):
            name = names[int(cls)]
            if class_name and str(class_name).strip().lower() not in ("", "all") \
                    and name.lower() != str(class_name).strip().lower():
                continue
            x1, y1, x2, y2 = res.boxes.xyxy[i].tolist()
            area = (x2 - x1) * (y2 - y1)
            if area > best_area:
                best_area = area
                poly = res.masks.xy[i]
                best = (poly, (x1, y1, x2, y2))
        if best is None:
            return None
        return best, (W, H)

    def caption(self, pil_img, length="normal"):
        proc, mdl = self._load_caption()
        import torch
        max_len = {"short": 20, "normal": 50, "long": 75}.get(length, 50)
        inputs = proc(pil_img, return_tensors="pt")
        out = mdl.generate(**inputs, max_length=max_len, num_beams=5)
        return proc.decode(out[0], skip_special_tokens=True).strip()

    def query(self, pil_img, question):
        proc, mdl = self._load_vqa()
        inputs = proc(pil_img, question, return_tensors="pt")
        out = mdl.generate(**inputs, max_length=50)
        return proc.decode(out[0], skip_special_tokens=True).strip()


manager = ModelManager()
