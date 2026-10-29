from fastapi import FastAPI
from sqlalchemy import text

from app import models  # noqa: F401
from app.database import engine
from app.routers import teams


app = FastAPI(
    title="Football Analytics API",
    version="0.1.0"
)


app.include_router(teams.router)


@app.get("/api/health")
def health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "connected",
    }