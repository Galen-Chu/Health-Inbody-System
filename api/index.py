"""Vercel serverless 進入點 — 所有 /api/* 經 rewrite 打到這裡.

Vercel Python runtime 偵測 ASGI app；backend 以 sys.path 掛入.
靜態前端由 Vercel 直接 serve（frontend/dist），main.py 內的
StaticFiles 掛載在無 dist 的 function 環境自動跳過.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "backend"))

from app.main import app  # noqa: E402
