"""Import API tests · 匯出→匯入 roundtrip 與 merge/replace 語義.

日期用 2027-03*，避開其他測試檔使用的日期（共用 DB）。
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

DAY = "2027-03-01"      # 備份內的日期
EXTRA = "2027-03-02"    # 備份外的日期（merge 應保留）
GONE = "2027-03-03"     # replace 應清掉的日期


def _seed_backup_data():
    client.put("/api/profile", json={
        "name": "匯入測試", "sex": "female", "height_cm": 160, "weight_kg": 55,
        "age": 28, "body_fat_pct": 25, "activity": "light", "goal": "maintain"})
    client.post("/api/body-metrics", json={
        "measured_on": DAY, "weight_kg": 55.0, "body_fat_pct": 25.0, "muscle_mass_kg": 22.0})
    client.post("/api/records", json={
        "record_date": DAY, "servings": {"grains": 2}, "water_ml": 1500, "note": "backup"})
    food = client.get("/api/foods", params={"q": "去皮雞胸肉"}).json()[0]
    client.post("/api/meals", json={"record_date": DAY, "food_id": food["id"], "grams": 100})


def _export():
    return client.get("/api/export").json()


def test_import_merge_restores_and_keeps_unrelated_days():
    _seed_backup_data()
    backup = _export()

    # 備份後繼續使用：改 profile、改同日記錄、新增備份外的日期
    client.put("/api/profile", json={
        "name": "改名了", "sex": "female", "height_cm": 160, "weight_kg": 56,
        "age": 28, "body_fat_pct": None, "activity": "light", "goal": "maintain"})
    client.post("/api/records", json={
        "record_date": DAY, "servings": {"fruits": 5}, "water_ml": 100, "note": "changed"})
    client.post("/api/records", json={
        "record_date": EXTRA, "servings": {"dairy": 1}, "water_ml": 300, "note": "extra day"})

    resp = client.post("/api/import", json=backup)
    assert resp.status_code == 200
    result = resp.json()
    assert result["mode"] == "merge"
    assert result["days_overwritten"] >= 1

    # profile 還原為備份當時
    assert client.get("/api/profile").json()["name"] == "匯入測試"
    # 備份內的日期：同日覆蓋回備份內容
    day = client.get(f"/api/records/{DAY}").json()
    assert day["servings"] == {"grains": 2}
    assert day["note"] == "backup"
    # 備份外的日期：不受影響
    assert client.get(f"/api/records/{EXTRA}").json()["note"] == "extra day"


def test_import_is_idempotent():
    backup = _export()
    first = client.post("/api/import", json=backup).json()
    second = client.post("/api/import", json=backup).json()
    for key in ("body_metrics", "daily_records", "meals", "days_overwritten"):
        assert first[key] == second[key]
    # 同一日餐點不因重複匯入而翻倍
    expected = len([m for m in backup["meals"] if m["record_date"] == DAY])
    meals = client.get("/api/meals", params={"day": DAY}).json()
    assert expected > 0
    assert len(meals) == expected


def test_import_replace_clears_data_not_in_backup():
    backup = _export()
    client.post("/api/records", json={
        "record_date": GONE, "servings": {}, "water_ml": 0, "note": "to be wiped"})

    resp = client.post("/api/import?mode=replace", json=backup)
    assert resp.status_code == 200
    assert resp.json()["mode"] == "replace"

    # 不在備份內的日期被清掉；備份內的日期完整重現
    assert client.get(f"/api/records/{GONE}").status_code == 404
    assert client.get(f"/api/records/{DAY}").json()["note"] == "backup"


def test_import_rejects_bad_payload_and_mode():
    assert client.post("/api/import", json={"foo": 1}).status_code == 422
    assert client.post("/api/import?mode=wipe", json={}).status_code == 422
