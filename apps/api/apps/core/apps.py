from django.apps import AppConfig
import logging


logger = logging.getLogger("nourx")


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    verbose_name = "Core"

    def ready(self):
        # Ensure S3 bucket exists in dev environments (MinIO) or when configured.
        # In production, buckets should already exist; this remains safe and idempotent.
        try:
            from django.conf import settings
            if not getattr(settings, "USE_S3", False):
                return
            bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", None)
            if not bucket:
                return

            import boto3
            from botocore.exceptions import ClientError
            from botocore.config import Config as BotoConfig

            endpoint_url = getattr(settings, "AWS_S3_ENDPOINT_URL", None)
            region_name = getattr(settings, "AWS_S3_REGION_NAME", None) or "us-east-1"

            s3_client = boto3.client(
                "s3",
                aws_access_key_id=getattr(settings, "AWS_ACCESS_KEY_ID", None),
                aws_secret_access_key=getattr(settings, "AWS_SECRET_ACCESS_KEY", None),
                region_name=region_name,
                endpoint_url=endpoint_url,
                config=BotoConfig(signature_version=getattr(settings, "AWS_S3_SIGNATURE_VERSION", "s3v4")),
            )

            # Check if bucket exists
            def _apply_public_policy_if_debug():
                from django.conf import settings as dj_settings
                if getattr(dj_settings, 'DEBUG', False):
                    try:
                        policy = {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Sid": "AllowPublicRead",
                                    "Effect": "Allow",
                                    "Principal": "*",
                                    "Action": ["s3:GetObject"],
                                    "Resource": [f"arn:aws:s3:::{bucket}/*"],
                                }
                            ],
                        }
                        import json
                        s3_client.put_bucket_policy(Bucket=bucket, Policy=json.dumps(policy))
                        logger.info(f"Public read policy applied to bucket '{bucket}' for development.")
                    except Exception as pe:
                        logger.warning(f"Could not apply public policy to bucket '{bucket}': {pe}")

            try:
                s3_client.head_bucket(Bucket=bucket)
                _apply_public_policy_if_debug()
                return
            except ClientError:
                pass

            # Create bucket
            create_kwargs = {"Bucket": bucket}
            # For AWS S3 (not MinIO) and non-us-east-1, location constraint is required
            if not endpoint_url and region_name and region_name != "us-east-1":
                create_kwargs["CreateBucketConfiguration"] = {"LocationConstraint": region_name}

            s3_client.create_bucket(**create_kwargs)
            logger.info(f"S3 bucket '{bucket}' created (region={region_name}, endpoint={endpoint_url}).")
            
            _apply_public_policy_if_debug()
        except Exception as e:
            # Don't block app startup; just log the issue
            logger.warning(f"Could not ensure S3 bucket exists: {e}")
