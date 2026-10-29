"""Health-Inbody-System backend · FastAPI entry.

API under /api；若前端已建置（frontend/dist 存在）直接由後端 serve
（單容器上雲情境），開發時前端走 Vite dev server 的 proxy.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db import init_db
from app.routers.api import FRONTEND_DIST, router
from app.routers.foods import router as foods_router

app = FastAPI(title="Health-Inbody-System", version="0.1.0")

# 開發期讓 Vite dev server (5173) 直連
app.add_middleware(CORSMiddleware, allow_origins=[
    "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"], allow_headers=["*"])

app.include_router(router)
app.include_router(foods_router)


@app.on_event("startup")
def startup():
    init_db()
    from app.seed import seed_foods_if_empty
    seeded = seed_foods_if_empty()
    if seeded:
        print(f" seeded {seeded} foods from data/foods_full.csv")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# 建置後的前端（單容器部署）
if (FRONTEND_DIST / "index.html").is_file():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
