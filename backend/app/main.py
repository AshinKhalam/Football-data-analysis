from fastapi import FastAPI
from sqlalchemy import text

from app import models  # noqa: F401
from app.database import engine


app = FastAPI(title="Football Analytics API")


@app.get("/api/health")
def health():
    with engine.connect() as connection:
        connection.execute(
            text("SELECT 1")
        )

    return {"status": "ok"}