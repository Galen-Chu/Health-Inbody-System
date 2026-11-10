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


def test_recent_foods():
    chicken = _first_food("去皮雞胸肉")
    egg = _first_food("雞蛋平均值")
    day = "2026-11-06"
    client.post("/api/meals", json={
        "record_date": day, "food_id": chicken["id"], "grams": 100})
    client.post("/api/meals", json={
        "record_date": day, "food_id": egg["id"], "grams": 50})

    recents = client.get("/api/foods/recent").json()
    assert recents, "should not be empty"
    ids = [f["id"] for f in recents]
    # 最新使用者排最前（egg 最後記錄）
    assert ids.index(egg["id"]) < ids.index(chicken["id"])


def test_summary_servings_estimate():
    rice = _first_food("大麥仁")          # grains
    chicken = _first_food("去皮雞胸肉")   # protein
    day = "2026-11-10"
    client.post("/api/meals", json={
        "record_date": day, "food_id": rice["id"], "grams": 200})       # 1 碗
    client.post("/api/meals", json={
        "record_date": day, "food_id": chicken["id"], "grams": 70})     # 2 份
    data = client.get(f"/api/summary/{day}").json()
    est = data["servings_estimate"]
    assert est["grains"] == 1.0
    assert est["protein"] == 2.0


def _food_by_category(category):
    return client.get("/api/foods", params={"category": category, "limit": 1}).json()[0]


def test_recommendations_uses_estimate_when_manual_empty():
    """只記餐點、沒填六大類 → 建議用估算：protein 唯一不足時必須被提出.

    區別性設計：其他五類都吃到目標以上，唯獨 protein 低於 50%——
    若無 fallback（intake={} 全零），前兩名缺口會是隨機的 0% 類別.
    """
    day = "2026-11-11"
    plan = [  # (類別, 公克)——tier 2000 目標：grains 3.5碗/dairy 1.5杯/veg 4份/fruit 3份/oils 6茶匙
        ("grains", 800), ("dairy", 400), ("vegetables", 450),
        ("fruits", 350), ("oils", 40), ("protein", 60),   # protein 1.7/6 份=28%
    ]
    for cat, grams in plan:
        food = _food_by_category(cat)
        client.post("/api/meals", json={
            "record_date": day, "food_id": food["id"], "grams": grams})
    client.post("/api/records", json={
        "record_date": day, "servings": {}, "water_ml": 2000})   # 手動為空

    recs = client.get(f"/api/recommendations/{day}").json()["recommendations"]
    group_recs = [r["type"] for r in recs if r["type"].startswith("group:")]
    # 唯一 <50% 的類別是 protein → 它必須出現在缺口建議裡
    assert "group:protein" in group_recs
    # 其他五類皆已達標 → 不應被列為缺口
    assert group_recs == ["group:protein"]
