# backend/fix_auraface_layout.py
import os
import shutil

# Paths
src = os.path.join("models", "auraface")
dst_root = os.path.join("models", "models")   # InsightFace expects "models/models/auraface"
dst = os.path.join(dst_root, "auraface")

# Ensure destination folder exists
os.makedirs(dst, exist_ok=True)

# Copy everything from Hugging Face auraface into InsightFace's expected path
for fname in os.listdir(src):
    src_path = os.path.join(src, fname)
    dst_path = os.path.join(dst, fname)
    if os.path.isfile(src_path):
        shutil.copy2(src_path, dst_path)
        print(f"Copied {src_path} -> {dst_path}")

print(f"✅ AuraFace files copied into {dst}")