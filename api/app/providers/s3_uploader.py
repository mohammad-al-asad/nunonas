import mimetypes
import re
import secrets
import time
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.core.config import Settings

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".heic", ".heif", ".bmp", ".svg"}

# Object keys are unique per upload, so the files can be cached indefinitely.
CACHE_CONTROL = "public, max-age=31536000, immutable"


@lru_cache
def _s3_client(region: str | None, access_key_id: str | None, secret_access_key: str | None):
    # Without explicit keys boto3 falls back to its default credential chain
    # (e.g. the IAM role attached to the EC2 instance).
    return boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=access_key_id or None,
        aws_secret_access_key=secret_access_key or None,
    )


class S3Uploader:
    def __init__(self, settings: Settings):
        self.settings = settings

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    async def upload_image(self, file: UploadFile, *, folder_suffix: str = "images") -> str:
        """Upload an image file to S3 and return its public URL.

        Rejects files that are neither an ``image/*`` content type nor carry an
        image file extension.
        """
        content_type = file.content_type or ""
        extension = Path(file.filename or "").suffix.lower()
        if not content_type.startswith("image/") and extension not in IMAGE_EXTENSIONS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file must be an image.")
        return await self._upload(file, folder_suffix=folder_suffix)

    async def upload_vendor_document(self, file: UploadFile, *, folder_suffix: str = "vendor-documents") -> str:
        """Upload any file (PDF, image, …) and return its public URL.

        Used for KYC/document uploads that may be non-image formats
        (e.g. PDF trade-licence scans).
        """
        return await self._upload(file, folder_suffix=folder_suffix)

    async def upload_document_bytes(
        self,
        data: bytes,
        *,
        filename: str,
        content_type: str,
        folder_suffix: str = "vendor-documents",
    ) -> str:
        """Upload generated file bytes (e.g. a signed contract PDF) and return its public URL."""
        return await self._upload_bytes(
            data,
            filename=filename,
            content_type=content_type,
            folder_suffix=folder_suffix,
        )

    # ------------------------------------------------------------------
    # Internal implementation
    # ------------------------------------------------------------------

    async def _upload(self, file: UploadFile, *, folder_suffix: str) -> str:
        file_bytes = await file.read()
        return await self._upload_bytes(
            file_bytes,
            filename=file.filename or "upload",
            content_type=file.content_type or "application/octet-stream",
            folder_suffix=folder_suffix,
        )

    async def _upload_bytes(
        self,
        file_bytes: bytes,
        *,
        filename: str,
        content_type: str,
        folder_suffix: str,
    ) -> str:
        bucket = self.settings.s3_bucket_name
        if not bucket or not self.settings.aws_region:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="S3 storage is not configured on the backend.",
            )

        if not file_bytes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

        key = self._build_key(filename, content_type, folder_suffix)
        client = _s3_client(
            self.settings.aws_region,
            self.settings.aws_access_key_id,
            self.settings.aws_secret_access_key,
        )

        try:
            await run_in_threadpool(
                client.put_object,
                Bucket=bucket,
                Key=key,
                Body=file_bytes,
                ContentType=content_type,
                CacheControl=CACHE_CONTROL,
            )
        except (BotoCoreError, ClientError) as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="File upload failed.") from exc

        return f"{self._public_base_url()}/{quote(key)}"

    def _build_key(self, filename: str, content_type: str, folder_suffix: str) -> str:
        path = Path(filename)
        stem = re.sub(r"[^A-Za-z0-9_-]+", "-", path.stem).strip("-")[:60] or "file"
        extension = path.suffix.lower() if re.fullmatch(r"\.[a-z0-9]{1,8}", path.suffix.lower()) else ""
        if not extension:
            extension = mimetypes.guess_extension(content_type) or ""

        folder = "/".join(part for part in (self.settings.s3_prefix.strip("/"), folder_suffix.strip("/")) if part)
        return f"{folder}/{int(time.time())}-{secrets.token_hex(4)}-{stem}{extension}"

    def _public_base_url(self) -> str:
        if self.settings.s3_public_base_url:
            return self.settings.s3_public_base_url.rstrip("/")
        return f"https://{self.settings.s3_bucket_name}.s3.{self.settings.aws_region}.amazonaws.com"
