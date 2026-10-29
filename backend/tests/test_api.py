"""API smoke tests · 獨立暫存 DB，不污染開發資料庫."""
import os
from pathlib import Path

_TMP_DB = Path(__file__).parent / "_test_api.db"
os.environ["HIS_DB_URL"] = f"sqlite:///{_TMP_DB.as_posix()}"

from fastapi.testclient import TestClient  # noqa: E402

from app.db import engine, init_db  # noqa: E402
from app.main import app  # noqa: E402

init_db()  # TestClient 不經 startup 事件，明確建表
client = TestClient(app)


def teardown_module():
    engine.dispose()  # Windows：釋放 sqlite 檔案鎖才能刪
    _TMP_DB.unlink(missing_ok=True)


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_profile_roundtrip():
    payload = {
        "name": "Galen", "sex": "male", "height_cm": 175, "weight_kg": 70,
        "age": 30, "body_fat_pct": 20, "activity": "moderate", "goal": "maintain",
    }
    resp = client.put("/api/profile", json=payload)
    assert resp.status_code == 200
    assert resp.json()["body_fat_pct"] == 20

    resp = client.get("/api/profile")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Galen"


def test_metrics_uses_katch_when_bfp_known():
    client.put("/api/profile", json={
        "name": "", "sex": "male", "height_cm": 175, "weight_kg": 70,
        "age": 30, "body_fat_pct": 20, "activity": "moderate", "goal": "maintain"})
    resp = client.get("/api/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["formula"] == "katch-mcardle"
    assert data["bmr"] == 1579.6
    assert data["water_target_ml"] == 2450
    assert set(data["six_groups"]["servings"]) == {
        "grains", "protein", "dairy", "vegetables", "fruits", "oils"}


def test_record_upsert_same_day():
    day = "2026-10-29"
    for servings in ({"grains": 2}, {"grains": 3, "protein": 1}):
        resp = client.post("/api/records", json={
            "record_date": day, "servings": servings, "water_ml": 1000})
        assert resp.status_code == 200
    resp = client.get(f"/api/records/{day}")
    assert resp.json()["servings"] == {"grains": 3, "protein": 1}
