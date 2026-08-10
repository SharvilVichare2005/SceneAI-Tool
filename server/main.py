"""
FastAPI inference server: a drop-in local replacement for Moondream's cloud API.

Endpoints (mirror Moondream shapes):
  GET  /health
  GET  /classes           -> COCO 80 class list (for the frontend class picker)
  GET  /model             -> current detection model + available options
  POST /model             -> {model} hot-swap YOLO model (no restart needed)
  POST /caption           -> {image_url, length}            -> {caption}
  POST /query             -> {image_url, question}          -> {answer}
  POST /detect            -> {image_url, object}            -> {objects: Region[]}
  POST /point             -> {image_url, object}            -> {points: Point[]}
  POST /segment           -> {image_url, object}            -> {path, bbox}

Run from the server/ directory:
    uvicorn main:app --reload --port 8000
"""

from datetime import datetime, timedelta, timezone
import base64
import hashlib
import hmac
import os
import secrets
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from models import manager
from image_utils import decode_image, polygon_to_svg

app = FastAPI(title="DL/NLP/YOLO Inference Server (Moondream replacement)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CaptionReq(BaseModel):
    image_url: str
    length: str = "normal"


class QueryReq(BaseModel):
    image_url: str
    question: str


class ObjectReq(BaseModel):
    image_url: str
    object: str = ""
    conf: float = 0.2


class ModelReq(BaseModel):
    model: str


class ProjectCreate(BaseModel):
    name: str
    task: Literal["detection", "segmentation", "classification"] = "detection"
    description: str = ""


class TrainingRunCreate(BaseModel):
    project_id: str
    model: str = "yolo11m"
    epochs: int = 50
    batch_size: int = 16
    image_size: int = 640
    learning_rate: float = 0.001
    device: Literal["cpu", "cuda"] = "cpu"


class Credentials(BaseModel):
    email: str
    password: str


AUTH_SECRET = os.environ.get("AUTH_SECRET", "local-development-secret-change-me")
TOKEN_TTL_HOURS = 24
_users: dict[str, dict[str, str]] = {}


def _password_hash(password: str, salt: str | None = None) -> tuple[str, str]:
    """Hash passwords with a per-user salt without storing plaintext."""
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 310_000)
    return salt, base64.b64encode(digest).decode()


def _issue_token(email: str) -> str:
    expires = int((datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS)).timestamp())
    payload = f"{email}|{expires}"
    signature = hmac.new(AUTH_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return base64.urlsafe_b64encode(f"{payload}|{signature}".encode()).decode()


def _current_user(authorization: str | None = Header(default=None)) -> dict[str, str]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        email, expires, signature = base64.urlsafe_b64decode(authorization[7:]).decode().rsplit("|", 2)
        payload = f"{email}|{expires}"
        expected = hmac.new(AUTH_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected) or int(expires) < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError
        return {"email": email, "name": _users.get(email, {}).get("name", email.split("@")[0])}
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(status_code=401, detail="Invalid or expired session")


# The workspace API is intentionally storage-agnostic for the MVP. These records
# can be swapped for the PostgreSQL repository in server/workspace_schema.sql
# without changing the React client contract.
_projects = [
    {"id": "warehouse-safety", "name": "Warehouse safety", "task": "detection", "images": 12840, "labeled": 82, "updated_at": "12 min ago"},
    {"id": "retail-shelf-audit", "name": "Retail shelf audit", "task": "segmentation", "images": 8420, "labeled": 64, "updated_at": "48 min ago"},
    {"id": "roadside-inventory", "name": "Roadside inventory", "task": "detection", "images": 4180, "labeled": 38, "updated_at": "Yesterday"},
]
_training_runs = [
    {"id": "run-240", "project_id": "warehouse-safety", "model": "yolo11m", "status": "completed", "map50": 0.948, "created_at": "12 min ago"},
    {"id": "run-239", "project_id": "retail-shelf-audit", "model": "yolov8m-seg", "status": "running", "map50": 0.893, "created_at": "18 min ago"},
]


def _decode(image_url: str):
    """decode_image with a friendly error instead of a raw traceback."""
    try:
        return decode_image(image_url)
    except Exception:
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not read the image. Re-save it as a valid JPG/PNG/WebP "
                "file, then try again."
            ),
        )


@app.get("/")
def root():
    return {
        "service": "DL/NLP/YOLO Inference Server",
        "endpoints": ["/health", "/classes", "/caption", "/query", "/detect", "/point", "/segment"],
    }


@app.post("/api/auth/register", status_code=201)
def register(credentials: Credentials):
    email = credentials.email.strip().lower()
    if "@" not in email or len(credentials.password) < 8:
        raise HTTPException(status_code=422, detail="Use a valid email and a password of at least 8 characters")
    if email in _users:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    salt, password_hash = _password_hash(credentials.password)
    _users[email] = {"name": email.split("@")[0].replace(".", " ").title(), "salt": salt, "password_hash": password_hash}
    return {"token": _issue_token(email), "user": {"email": email, "name": _users[email]["name"]}}


@app.post("/api/auth/login")
def login(credentials: Credentials):
    email = credentials.email.strip().lower()
    user = _users.get(email)
    if not user:
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    _, candidate_hash = _password_hash(credentials.password, user["salt"])
    if not hmac.compare_digest(candidate_hash, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    return {"token": _issue_token(email), "user": {"email": email, "name": user["name"]}}


@app.get("/api/auth/me")
def current_user(user: dict[str, str] = Depends(_current_user)):
    return {"user": user}


@app.get("/api/projects")
def list_projects():
    """List projects for the web workspace. Replace the in-memory store with Postgres in production."""
    return {"items": _projects, "total": len(_projects)}


@app.post("/api/projects", status_code=201)
def create_project(req: ProjectCreate):
    project = {
        "id": req.name.lower().replace(" ", "-"),
        "name": req.name.strip(),
        "task": req.task,
        "description": req.description,
        "images": 0,
        "labeled": 0,
        "updated_at": "Just now",
    }
    _projects.insert(0, project)
    return project


@app.get("/api/training/runs")
def list_training_runs():
    return {"items": _training_runs, "total": len(_training_runs)}


@app.post("/api/training/runs", status_code=202)
def create_training_run(req: TrainingRunCreate):
    run = {
        "id": f"run-{len(_training_runs) + 241}",
        "project_id": req.project_id,
        "model": req.model,
        "status": "queued",
        "map50": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "config": req.model_dump(),
    }
    _training_runs.insert(0, run)
    return run


@app.get("/api/model-hub")
def model_hub():
    return {
        "items": [
            {"id": "yolo11", "name": "YOLO11", "task": "detection", "framework": "PyTorch", "status": "ready"},
            {"id": "yolov8-seg", "name": "YOLOv8-seg", "task": "segmentation", "framework": "PyTorch", "status": "ready"},
            {"id": "resnet50", "name": "ResNet-50", "task": "classification", "framework": "PyTorch / TensorFlow", "status": "ready"},
            {"id": "alexnet", "name": "AlexNet", "task": "classification", "framework": "PyTorch", "status": "ready"},
            {"id": "custom", "name": "Custom model", "task": "custom", "framework": "PyTorch / TensorFlow", "status": "available"},
        ]
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/classes")
def get_classes():
    return {"classes": list(manager.coco_names().values())}


@app.get("/model")
def get_model():
    return manager.model_info()


@app.post("/model")
def set_model(req: ModelReq):
    try:
        return manager.set_model(req.model)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/caption")
async def caption(req: CaptionReq):
    pil, _ = await run_in_threadpool(_decode, req.image_url)
    try:
        text = await run_in_threadpool(manager.caption, pil, req.length)
    except (ImportError, ModuleNotFoundError):
        text = "Image received. Install the Transformers runtime to enable local BLIP captioning."
    return {"caption": text}


@app.post("/query")
async def query(req: QueryReq):
    pil, _ = await run_in_threadpool(_decode, req.image_url)
    try:
        answer = await run_in_threadpool(manager.query, pil, req.question)
    except (ImportError, ModuleNotFoundError):
        answer = "Image received. Install the Transformers runtime to enable local visual question answering."
    return {"answer": answer}


@app.post("/detect")
async def detect(req: ObjectReq):
    _, npimg = await run_in_threadpool(_decode, req.image_url)
    try:
        objs, _ = await run_in_threadpool(manager.detect, npimg, req.object, req.conf)
    except (ImportError, ModuleNotFoundError):
        objs = []
    return {"objects": objs}


@app.post("/point")
async def point(req: ObjectReq):
    _, npimg = await run_in_threadpool(_decode, req.image_url)
    try:
        pts = await run_in_threadpool(manager.points, npimg, req.object, req.conf)
    except (ImportError, ModuleNotFoundError):
        pts = []
    return {"points": pts}


@app.post("/segment")
async def segment(req: ObjectReq):
    _, npimg = await run_in_threadpool(_decode, req.image_url)
    res = await run_in_threadpool(manager.segment, npimg, req.object, req.conf)
    if res is None:
        raise HTTPException(
            status_code=422,
            detail=f"No '{req.object}' found to segment. Try another COCO class.",
        )
    (poly, bbox_px), (W, H) = res
    path, bbox = polygon_to_svg(poly, bbox_px, W, H)
    return {"path": path, "bbox": bbox}
