"""Alembic env · 直接掛上專案的 engine 與 metadata.

- DB URL 一律來自 app.config.DB_URL（環境變數 HIS_DB_URL），alembic.ini 不寫死
- online 模式沿用 app.db.engine（繼承 pool_pre_ping 等設定）
- SQLite 開 render_as_batch：ALTER 限制下用「建新表→搬資料→改名」批次模式
"""
from logging.config import fileConfig

from alembic import context

# 讓 alembic 能在 backend/ 目錄下直接執行（python -m alembic）
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import Base, engine  # noqa: E402
import app.models  # noqa: F401,E402 — 註冊表
import app.models_food  # noqa: F401,E402

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = str(engine.url)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=engine.dialect.name == "sqlite",
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=connection.dialect.name == "sqlite",
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
