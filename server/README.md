# Inference Server (DL + NLP + YOLO)

Local Python backend that replaces the Moondream cloud API used by the original
mobile app. Powers the Next.js frontend in `../web`.

## Models (all run on CPU)
| Endpoint  | Model                          | Task                          |
|-----------|--------------------------------|-------------------------------|
| /detect   | YOLOv8n                        | Object detection (COCO 80)    |
| /point    | YOLOv8n (box centers)          | Point localization            |
| /segment  | YOLOv8n-seg                    | Instance segmentation         |
| /caption  | BLIP image-captioning (base)   | Image captioning (NLP)        |
| /query    | BLIP-VQA (base)                | Visual question answering     |

> Note: `detect`/`point`/`segment` are **closed-set** (COCO 80 classes). The
> frontend uses a class picker instead of the old free-text box. `caption` and
> `query` are open-ended (true vision+language / NLP).

Weights download automatically on first request (YOLO ~6MB each, BLIP ~1GB each),
so the server starts instantly and pays the download cost only when a mode is
first used.

## Setup
```bash
# CPU-only torch keeps the install small
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

## Run
```bash
uvicorn main:app --reload --port 8000
```
Frontend expects it at `http://localhost:8000`.
