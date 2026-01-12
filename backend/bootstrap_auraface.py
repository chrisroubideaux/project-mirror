print("🔥 bootstrap_auraface.py STARTED")

import os
from huggingface_hub import snapshot_download

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
AURAFACE_DIR = os.path.join(MODELS_DIR, "auraface")

print("BASE_DIR =", BASE_DIR)
print("AURAFACE_DIR =", AURAFACE_DIR)

os.makedirs(AURAFACE_DIR, exist_ok=True)
print("📁 Directory ensured")

print("⬇️ Starting snapshot_download...")
snapshot_download(
    repo_id="chrisroubideaux/auraface-models",
    local_dir=AURAFACE_DIR,
    local_dir_use_symlinks=False
)

print("✅ DOWNLOAD COMPLETE")
print("📦 Contents:", os.listdir(AURAFACE_DIR))
