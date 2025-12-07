import asyncio

import uvicorn

import db.migration
from app.app import app
from s3_client import ensure_bucket_exists


async def start_api():
    config = uvicorn.Config(app, host="0.0.0.0", port=8000)
    server = uvicorn.Server(config)
    await server.serve()


async def main():
    await asyncio.gather(
        start_api()
    )


if __name__ == '__main__':
    db.migration.migration_up()
    try:
        ensure_bucket_exists()
    except Exception as e:
        print(f"Warning: Could not initialize MinIO bucket: {e}")
    asyncio.run(main())
