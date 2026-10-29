"""Foods / meals / summary API tests · DB 由 conftest.py 統一配置."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_food_search_by_keyword():
    resp = client.get("/api/foods", params={"q": "雞胸肉"})
    assert resp.status_code == 200
    names = [f["name"] for f in resp.json()]
    assert any("雞胸肉" in n for n in names)


def test_food_search_category_filter():
    resp = client.get("/api/foods", params={"category": "dairy", "limit": 100})
    assert resp.status_code == 200
    assert resp.json() and all(f["category"] == "dairy" for f in resp.json())


def test_food_search_bad_category():
    assert client.get("/api/foods", params={"category": "junk"}).status_code == 422


def _first_food(q: str) -> dict:
    return client.get("/api/foods", params={"q": q}).json()[0]


def test_meal_add_and_summary():
    chicken = _first_food("去皮雞胸肉")      # 104 kcal / 22.4g protein per 100g
    day = "2026-10-29"
    resp = client.post("/api/meals", json={
        "record_date": day, "food_id": chicken["id"], "grams": 200})
    assert resp.status_code == 200
    entry = resp.json()
    assert entry["calories_kcal"] == 208.0
    assert entry["protein_g"] == 44.8
    assert entry["food_name"] == chicken["name"]

    rice = _first_food("米")                 # 加入第二筆
    client.post("/api/meals", json={
        "record_date": day, "food_id": rice["id"], "grams": 100})

    resp = client.get(f"/api/summary/{day}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["calories_total"] > 208.0
    assert data["calorie_target"] > 0
    assert data["water_from_food_ml"] >= 0
    assert len(data["meals"]) == 2
    assert data["macros"]["protein_g"] >= 44.8


def test_meal_delete():
    egg = _first_food("雞蛋平均值")
    day = "2026-10-28"
    resp = client.post("/api/meals", json={
        "record_date": day, "food_id": egg["id"], "grams": 50})
    entry_id = resp.json()["id"]
    assert client.delete(f"/api/meals/{entry_id}").status_code == 204
    assert client.get(f"/api/summary/{day}").json()["meals"] == []


def test_meal_unknown_food_404():
    resp = client.post("/api/meals", json={
        "record_date": "2026-10-29", "food_id": 999999, "grams": 100})
    assert resp.status_code == 404


def test_recommendations_endpoint():
    day = "2026-10-30"
    chicken = _first_food("去皮雞胸肉")
    client.post("/api/meals", json={
        "record_date": day, "food_id": chicken["id"], "grams": 150})
    client.post("/api/records", json={
        "record_date": day, "servings": {}, "water_ml": 400})
    resp = client.get(f"/api/recommendations/{day}")
    assert resp.status_code == 200
    recs = resp.json()["recommendations"]
    assert len(recs) >= 1
    for r in recs:
        assert r["en"] and r["zh"] and r["level"] in {"info", "warning", "positive"}
    # 蔬菜缺口應被提出（當日只吃雞胸肉）
    assert any(r["type"].startswith("group:") for r in recs)
