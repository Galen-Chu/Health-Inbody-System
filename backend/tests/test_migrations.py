"""Alembic 遷移機制測試 · init_db 的版本感知邏輯（N2）.

conftest 已對全新 _test.db 跑過 init_db（= create_all + stamp head），
此處驗證：版本表存在、標記在 head、重跑（upgrade 路徑）冪等.
"""
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text

from app.db import BACKEND_ROOT, SessionLocal, engine, init_db


def test_alembic_version_table_stamped_at_head():
    tables = set(inspect(engine).get_table_names())
    assert "alembic_version" in tables

    with SessionLocal() as db:
        current = db.execute(text("SELECT version_num FROM alembic_version")).scalar()
    head = ScriptDirectory(str(BACKEND_ROOT / "alembic")).get_current_head()
    assert current == head


def test_init_db_rerun_is_idempotent():
    # 已有 alembic_version → 走 upgrade head 路徑；已在 head 上應安然無事
    init_db()
    init_db()
    assert set(inspect(engine).get_table_names()) >= {
        "profile", "daily_records", "body_metrics", "foods", "meal_entries"}
