"""Recommendation engine tests — 規則邊界情境."""
from app.engine.recommender import generate_recommendations

TARGETS = {"grains": 3, "protein": 5, "dairy": 1.5,
           "vegetables": 3, "fruits": 2, "oils": 5}


def _run(**over):
    args = dict(
        calories_total=1800, calorie_target=1958.7,
        water_total_ml=2000, water_target_ml=2457,
        six_group_intake={}, six_group_targets=TARGETS,
        protein_g=75, weight_kg=70.2)
    args.update(over)
    return generate_recommendations(**args)


def test_all_on_target_positive():
    recs = _run(six_group_intake=TARGETS)
    assert len(recs) == 1
    assert recs[0]["type"] == "positive"
    assert "一致性" in recs[0]["zh"]


def test_calorie_overrun_warns():
    recs = _run(calories_total=2300, six_group_intake=TARGETS)
    assert any(r["type"] == "calories" and r["level"] == "warning" for r in recs)


def test_calorie_under_logged_hints():
    recs = _run(calories_total=900, protein_g=90, six_group_intake=TARGETS)
    assert any(r["type"] == "calories" and r["level"] == "info" for r in recs)


def test_low_water_hint_with_gap():
    recs = _run(water_total_ml=800, six_group_intake=TARGETS)
    water = [r for r in recs if r["type"] == "water"]
    assert water and water[0]["level"] == "info"
    assert "1657" in water[0]["zh"]   # 2457 - 800


def test_protein_floor():
    recs = _run(protein_g=40, six_group_intake=TARGETS)
    protein = [r for r in recs if r["type"] == "protein"]
    assert protein and protein[0]["level"] == "warning"
    assert "70" in protein[0]["zh"]  # 70.2kg × 1.0 ≈ 70


def test_six_group_shortfalls_capped_at_two():
    intake = {"grains": 0, "protein": 0, "dairy": 0,
              "vegetables": 0, "fruits": 0, "oils": 5}
    recs = _run(six_group_intake=intake, protein_g=90)
    group_recs = [r for r in recs if r["type"].startswith("group:")]
    assert len(group_recs) == 2
    # 最不足的 grains 與 protein（同為 0%）排最前
    assert {r["type"] for r in group_recs} == {"group:grains", "group:protein"}


def test_recommendations_bilingual():
    recs = _run(six_group_intake={"grains": 0.5})
    for r in recs:
        assert r["en"] and r["zh"]
