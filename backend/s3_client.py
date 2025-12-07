import json
import logging
import mimetypes
import uuid
from datetime import timedelta
from io import BytesIO

from minio import Minio
from minio.error import S3Error

import config

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)


def get_minio_client() -> Minio:
    client = Minio(
        config.MINIO_ENDPOINT,
        access_key=config.MINIO_ACCESS_KEY,
        secret_key=config.MINIO_SECRET_KEY,
        secure=config.MINIO_SECURE
    )
    return client


def ensure_bucket_exists():
    try:
        client = get_minio_client()
        if not client.bucket_exists(config.MINIO_BUCKET):
            client.make_bucket(config.MINIO_BUCKET)
            logger.info(f"Bucket {config.MINIO_BUCKET} created")
            set_bucket_public_policy()
        else:
            logger.info(f"Bucket {config.MINIO_BUCKET} already exists")
            try:
                set_bucket_public_policy()
            except Exception as e:
                logger.warning(f"Could not set bucket policy: {e}")
    except S3Error as e:
        logger.error(f"Error ensuring bucket exists: {e}")
        raise


def set_bucket_public_policy():
    try:
        client = get_minio_client()
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{config.MINIO_BUCKET}/*"]
                }
            ]
        }
        client.set_bucket_policy(config.MINIO_BUCKET, json.dumps(policy))
        logger.info(f"Bucket {config.MINIO_BUCKET} policy set to public read")
    except Exception as e:
        logger.warning(f"Could not set bucket policy (may need manual setup): {e}")


def upload_photo(file_data: bytes, file_extension: str = "jpg") -> str:
    try:
        client = get_minio_client()
        ensure_bucket_exists()
        file_name = f"{uuid.uuid4()}.{file_extension}"
        object_name = f"reviews/{file_name}"
        file_stream = BytesIO(file_data)
        mime_type, _ = mimetypes.guess_type(f"file.{file_extension}")
        file_size = len(file_data)
        if not mime_type:
            mime_type = f"image/{file_extension}"

        client.put_object(
            config.MINIO_BUCKET,
            object_name,
            file_stream,
            file_size,
            content_type=mime_type
        )

        protocol = "https" if config.MINIO_SECURE else "http"
        public_url = f"{config.MINIO_PUBLIC_URL}/{config.MINIO_BUCKET}/{object_name}"

        logger.info(f"Photo uploaded successfully: {object_name}")
        return public_url

    except S3Error as e:
        logger.error(f"Error uploading photo to MinIO: {e}")
        raise


def get_photo_url(object_name: str) -> str:
    try:
        client = get_minio_client()
        url = client.presigned_get_object(
            config.MINIO_BUCKET,
            object_name,
            expires=timedelta(days=7)
        )
        return url
    except S3Error as e:
        logger.error(f"Error getting photo URL: {e}")
        raise
