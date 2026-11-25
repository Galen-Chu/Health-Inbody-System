"""Database session · SQLAlchemy."""
from pathlib import Path

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DB_URL

# pool_pre_ping：Neon 免費版閒置會休眠，取用連線前先探活，
# 避免冷喚醒期間的 stale connection 造成間歇性 500
engine = create_engine(DB_URL, pool_pre_ping=True,
                       connect_args={"check_same_thread": False}
                       if DB_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _alembic(cfg_cmd: str, revision: str = "head") -> None:
    from alembic import command
    from alembic.config import Config

    cfg = Config(str(BACKEND_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    if cfg_cmd == "upgrade":
        command.upgrade(cfg, revision)
    else:
        command.stamp(cfg, revision)


def init_db() -> None:
    """確保資料庫結構就緒 · N2 起 schema 演進由 Alembic 接管.

    - 全新資料庫（無任何表）：create_all 建出目前 schema（＝ migration head）並 stamp
    - 既有資料庫但沒有 alembic_version（2026-11-25 前的舊庫，如線上 Neon）：stamp head
    - 其餘：alembic upgrade head 套用後續遷移（冪等——已在 head 則無動作）

    單人自用系統、單一部署，冷啟動自動升級的併發風險可忽略.
    """
    import app.models  # noqa: F401 — register tables
    import app.models_food  # noqa: F401

    tables = set(inspect(engine).get_table_names())
    if not tables:
        Base.metadata.create_all(engine)
        _alembic("stamp")
    elif "alembic_version" not in tables:
        _alembic("stamp")
    else:
        _alembic("upgrade")
