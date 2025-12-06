import asyncio

import uvicorn

import db.migration
from app.app import app


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
    asyncio.run(main())
