"""Health-Inbody-System backend · FastAPI entry.

API under /api；若前端已建置（frontend/dist 存在）直接由後端 serve
（單容器上雲情境），開發時前端走 Vite dev server 的 proxy.

認證（Issue #1 決策 2 · 方案 B）：設定環境變數 HIS_API_TOKEN 後，
所有 /api/* 請求需通過認證——Bearer header 或登入核發的 his_session
cookie 皆可（/api/health 與 /api/auth/* 除外）。未設定＝開放（本機開發）。
"""
import os
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.db import init_db
from app.routers.api import FRONTEND_DIST, router
from app.routers.foods import router as foods_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    from app.seed import seed_foods_if_empty
    seeded = seed_foods_if_empty()
    if seeded:
        print(f" seeded {seeded} foods from data/foods_full.csv")
    yield


app = FastAPI(title="Health-Inbody-System", version="0.2.0", lifespan=lifespan)

# 開發期讓 Vite dev server (5173) 直連
app.add_middleware(CORSMiddleware, allow_origins=[
    "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"], allow_headers=["*"])


@app.middleware("http")
async def token_auth(request: Request, call_next):
    """認證：Bearer header 或 his_session cookie（/api/auth/login 核發）皆可.

    設定 HIS_API_TOKEN 即生效（每請求讀取，便於測試與熱改）；
    常數時間比對（bytes 版對任意輸入皆安全），避免時序側通道.
    """
    expected = os.environ.get("HIS_API_TOKEN", "")
    path = request.url.path
    if expected and path.startswith("/api") \
            and path != "/api/health" and not path.startswith("/api/auth/"):
        auth = request.headers.get("Authorization", "")
        cookie = request.cookies.get("his_session", "")
        ok_bearer = bool(auth) and secrets.compare_digest(
            auth.encode("utf-8"), f"Bearer {expected}".encode("utf-8"))
        ok_cookie = bool(cookie) and secrets.compare_digest(
            cookie.encode("utf-8"), expected.encode("utf-8"))
        if not (ok_bearer or ok_cookie):
            return JSONResponse(
                {"detail": "unauthorized — login at Settings, or set "
                           "Authorization: Bearer <token>"},
                status_code=401)
    return await call_next(request)


app.include_router(router)
app.include_router(foods_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# 建置後的前端（單容器部署）
if (FRONTEND_DIST / "index.html").is_file():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
