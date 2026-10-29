"""pytest 共用環境：所有測試共用一個暫存 DB（在 app import 前設定）."""
import os
from pathlib import Path

_TMP_DB = Path(__file__).parent / "_test.db"
_TMP_DB.unlink(missing_ok=True)
os.environ["HIS_DB_URL"] = f"sqlite:///{_TMP_DB.as_posix()}"

from app.db import engine, init_db  # noqa: E402
from app.seed import seed_foods_if_empty  # noqa: E402

init_db()
seed_foods_if_empty()


def pytest_sessionfinish(session, exitstatus):
    engine.dispose()          # Windows：釋放檔案鎖才能刪
    _TMP_DB.unlink(missing_ok=True)
