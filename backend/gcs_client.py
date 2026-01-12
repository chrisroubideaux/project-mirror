# backend/gcs_client.py

from google.cloud import storage
import os

BUCKET_NAME = os.getenv("GCS_BUCKET", "project-mirror-assets-aurora")

def upload_file_to_gcs(file_obj, destination_blob_name: str) -> str:
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_file(
        file_obj,
        content_type=file_obj.content_type
    )

    return f"https://storage.googleapis.com/{BUCKET_NAME}/{destination_blob_name}"
