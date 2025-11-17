# backend/gcs_client.py
from google.cloud import storage
import os

# Use env var if present, otherwise default to your bucket
BUCKET_NAME = os.getenv("GCS_BUCKET", "fitbylena-profile-images")

def upload_file_to_gcs(file_obj, destination_blob_name: str) -> str:
    """
    Upload a file (Flask request.files['image']) to Google Cloud Storage
    and return its public URL.

    Compatible with Uniform Bucket-Level Access (no per-object ACLs).
    """
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(destination_blob_name)

    # Upload the file
    blob.upload_from_file(file_obj, content_type=file_obj.content_type)

    # Return the public URL (public access must be enabled at bucket IAM level)
    return f"https://storage.googleapis.com/{BUCKET_NAME}/{destination_blob_name}"