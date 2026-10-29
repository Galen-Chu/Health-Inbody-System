"""Recommendation engine · 每日規則建議引擎

輸入當日攝取與個人目標，輸出雙語可行動建議。
純函式（M4 v1 規則版；未來 ML 食物預測走同一介面）.
"""
from app.engine.six_groups import GROUPS


def generate_recommendations(
    calories_total: float,
    calorie_target: float,
    water_total_ml: float,
    water_target_ml: float,
    six_group_intake: dict,
    six_group_targets: dict,
    protein_g: float,
    weight_kg: float,
) -> list:
    """規則建議：熱量平衡 → 水分 → 蛋白質 → 六大類缺口 → 正向回饋.

    每則 {type, level, en, zh}；level: warning(需行動) / info(調整) / positive(達標).
    """
    recs = []

    # --- 熱量平衡 ---
    cal_ratio = calories_total / calorie_target if calorie_target else 0
    if cal_ratio > 1.1:
        recs.append({
            "type": "calories", "level": "warning",
            "en": f"Calories are at {round(cal_ratio * 100)}% of target — over budget. A light walk and a vegetable-forward next meal help.",
            "zh": f"熱量已達目標的 {round(cal_ratio * 100)}%，超過預算。建議輕度活動，下一餐以蔬菜為主。",
        })
    elif cal_ratio < 0.6:
        recs.append({
            "type": "calories", "level": "info",
            "en": f"Only {round(cal_ratio * 100)}% of the calorie target recorded so far. If the day is over, add a balanced snack; unlogged meals don't count.",
            "zh": f"目前只記錄了目標熱量的 {round(cal_ratio * 100)}%。若還沒吃夠請補一餐均衡點心；若已吃未記，記得補登記。",
        })

    # --- 水分 ---
    water_ratio = water_total_ml / water_target_ml if water_target_ml else 0
    if water_ratio < 0.6:
        gap = round(water_target_ml - water_total_ml)
        recs.append({
            "type": "water", "level": "info",
            "en": f"Water intake is at {round(water_ratio * 100)}% of the target — about {gap} ml short. A full glass now is an easy win.",
            "zh": f"水分只達目標的 {round(water_ratio * 100)}%，還差約 {gap} ml。現在喝滿一杯水是最簡單的補分。",
        })

    # --- 蛋白質（下限 1.0 g/kg；熱量已近目標時特別重要）---
    protein_floor = weight_kg * 1.0
    if cal_ratio >= 0.6 and protein_g < protein_floor:
        recs.append({
            "type": "protein", "level": "warning",
            "en": f"Protein is {round(protein_g)}g but at least {round(protein_floor)}g ({weight_kg:.0f}kg × 1.0) is needed to keep muscle while dieting. Lean options: chicken breast, tofu, egg, plain yogurt.",
            "zh": f"蛋白質 {round(protein_g)}g 低於 {round(protein_floor)}g 下限（{weight_kg:.0f}kg × 1.0）——減脂期保肌肉的關鍵。優先選雞胸肉、豆腐、雞蛋、無糖優格。",
        })

    # --- 六大類缺口：只提最不足的兩類（避免噪音）---
    shortfalls = []
    for key, target in six_group_targets.items():
        if key not in GROUPS:
            continue
        eaten = six_group_intake.get(key, 0.0)
        if target > 0:
            shortfalls.append((key, eaten / target))
    shortfalls.sort(key=lambda x: x[1])
    for key, ratio in shortfalls[:2]:
        if ratio < 0.5:
            name_zh, name_en, unit = GROUPS[key]
            need = six_group_targets[key] - six_group_intake.get(key, 0.0)
            recs.append({
                "type": f"group:{key}", "level": "info",
                "en": f"{name_en} is at {round(ratio * 100)}% of the guideline — {need:g} {unit} short. Anchor it into your next meal.",
                "zh": f"{name_zh}只達建議量的 {round(ratio * 100)}%，還差 {need:g} {unit}。下一餐把它排進去。",
            })

    # --- 全數達標的正向回饋 ---
    if not recs:
        recs.append({
            "type": "positive", "level": "positive",
            "en": "Calories, water and all six food groups are on target. Consistency beats perfection — well logged.",
            "zh": "熱量、水分與六大類都到位了。一致性勝過完美——記錄得很完整。",
        })

    return recs
