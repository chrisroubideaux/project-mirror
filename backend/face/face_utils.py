# backend/face/face_utils.py
import os
import numpy as np
import cv2
import requests
from insightface.app import FaceAnalysis

# ---------------- Paths ----------------
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_MODELS_DIR = os.path.join(_BACKEND_DIR, "models")
_AURAFACE_DIR = os.path.join(_MODELS_DIR, "auraface")

def _ensure_auraface():
    required = [
        "scrfd_10g_bnkps.onnx",
        "2d106det.onnx",
        "1k3d68.onnx",
        "glintr100.onnx",
        "genderage.onnx",
        "model.yaml",
    ]

    missing = [
        f for f in required
        if not os.path.exists(os.path.join(_AURAFACE_DIR, f))
    ]

    if missing:
        raise RuntimeError(
            f"AuraFace missing files in {_AURAFACE_DIR}: {missing}"
        )

    return _BACKEND_DIR

# ---------------- Init InsightFace ----------------
_ROOT = _ensure_auraface()

app = FaceAnalysis(
    name="auraface",
    root=_ROOT
)
app.prepare(ctx_id=-1, det_size=(640, 640))

# ---------------- Utilities ----------------
def _bytes_to_cv2(image_bytes: bytes):
    arr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

def get_embedding_from_bytes(image_bytes: bytes):
    img = _bytes_to_cv2(image_bytes)
    faces = app.get(img)
    if not faces:
        return None
    return faces[0].normed_embedding.tolist()

def get_embedding_from_gcs(bucket: str, object_path: str):
    url = f"https://storage.googleapis.com/{bucket}/{object_path}"
    resp = requests.get(url, timeout=10)
    if resp.status_code != 200:
        return None
    return get_embedding_from_bytes(resp.content)

def cosine_similarity(emb1, emb2):
    v1, v2 = np.array(emb1), np.array(emb2)
    return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))
