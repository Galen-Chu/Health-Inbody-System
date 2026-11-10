"""API smoke tests · DB 由 conftest.py 統一配置."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


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
    assert data["ready"] is True
    assert data["formula"] == "katch-mcardle"
    assert data["bmr"] == 1579.6
    assert data["water_target_ml"] == 2450
    assert set(data["six_groups"]["servings"]) == {
        "grains", "protein", "dairy", "vegetables", "fruits", "oils"}


def test_metrics_not_ready_when_profile_incomplete():
    """未填個人資料 → 200 + ready=False（引導填寫），不是 500."""
    from sqlalchemy import select

    from app.db import SessionLocal
    from app.models import Profile

    # 共用 DB：自我重設為未填狀態，不依賴測試順序
    db = SessionLocal()
    profile = db.scalar(select(Profile).where(Profile.id == 1)) or Profile(id=1)
    profile.sex = ""
    profile.height_cm = 0
    profile.weight_kg = 0
    profile.age = 0
    profile.body_fat_pct = None
    db.add(profile)
    db.commit()
    db.close()

    resp = client.get("/api/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ready"] is False
    assert set(data["missing"]) == {"sex", "height_cm", "weight_kg", "age"}

    # 補齊後恢復 ready=True
    client.put("/api/profile", json={
        "name": "", "sex": "male", "height_cm": 175, "weight_kg": 70,
        "age": 30, "body_fat_pct": None, "activity": "moderate", "goal": "maintain"})
    resp = client.get("/api/metrics")
    assert resp.json()["ready"] is True


def test_record_upsert_same_day():
    day = "2027-01-01"   # 避開 foods 測試用的日期
    for servings in ({"grains": 2}, {"grains": 3, "protein": 1}):
        resp = client.post("/api/records", json={
            "record_date": day, "servings": servings, "water_ml": 1000})
        assert resp.status_code == 200
    resp = client.get(f"/api/records/{day}")
    assert resp.json()["servings"] == {"grains": 3, "protein": 1}


def test_body_metrics_roundtrip():
    for day, weight, bfp, muscle in [("2026-10-01", 71.5, 21.0, 30.2),
                                     ("2026-10-15", 70.8, 20.4, 30.5)]:
        resp = client.post("/api/body-metrics", json={
            "measured_on": day, "weight_kg": weight,
            "body_fat_pct": bfp, "muscle_mass_kg": muscle})
        assert resp.status_code == 200
        assert resp.json()["weight_kg"] == weight

    resp = client.get("/api/body-metrics")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 2
    # API 依日期新→舊排序
    assert items[0]["measured_on"] >= items[-1]["measured_on"]


class TestExport:
    def test_export_json_full_structure(self):
        resp = client.get("/api/export")
        assert resp.status_code == 200
        assert resp.headers["content-disposition"].endswith('his_export.json"')
        dump = resp.json()
        for key in ("exported_at", "profile", "body_metrics", "meals", "daily_records"):
            assert key in dump
        assert len(dump["body_metrics"]) >= 2   # test_body_metrics_roundtrip 建的

    def test_export_csv_zip(self):
        import io
        import zipfile

        resp = client.get("/api/export?format=csv")
        assert resp.status_code == 200
        zf = zipfile.ZipFile(io.BytesIO(resp.content))
        names = set(zf.namelist())
        assert names == {"his_body_metrics.csv", "his_meals.csv", "his_daily_records.csv"}
        header = zf.read("his_body_metrics.csv").decode("utf-8").splitlines()[0]
        assert "measured_on" in header and "weight_kg" in header

    def test_export_bad_format(self):
        assert client.get("/api/export?format=xml").status_code == 422
