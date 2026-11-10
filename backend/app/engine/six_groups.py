"""Six food groups engine · 六大類食物份量模型

Maps daily calorie target to servings of Taiwan's six food groups
(國民飲食指南 2018, 衛福部國民健康署). Values follow the guideline's
calorie tiers; the tier at or above the target is used.
"""

# 六大類：(中文, 英文, 份量單位)
GROUPS = {
    "grains": ("全榖雜糧類", "Grains", "碗"),
    "protein": ("豆魚蛋肉類", "Protein", "份"),
    "dairy": ("乳品類", "Dairy", "杯"),
    "vegetables": ("蔬菜類", "Vegetables", "份"),
    "fruits": ("水果類", "Fruits", "份"),
    "oils": ("油脂與堅果種子類", "Oils & Nuts", "茶匙"),
}

# 國民飲食指南熱量階梯 → 六大類份量（份量單位見 GROUPS）
TIERS = {
    1200: {"grains": 1.5, "protein": 3, "dairy": 1.5, "vegetables": 2, "fruits": 2, "oils": 3},
    1500: {"grains": 2.5, "protein": 4, "dairy": 1.5, "vegetables": 3, "fruits": 2, "oils": 4},
    1800: {"grains": 3, "protein": 5, "dairy": 1.5, "vegetables": 3, "fruits": 2, "oils": 5},
    2000: {"grains": 3.5, "protein": 6, "dairy": 1.5, "vegetables": 4, "fruits": 3, "oils": 6},
    2200: {"grains": 4, "protein": 6, "dairy": 1.5, "vegetables": 4, "fruits": 3.5, "oils": 6},
    2500: {"grains": 5, "protein": 7, "dairy": 1.5, "vegetables": 5, "fruits": 4, "oils": 7},
}


def daily_targets(calorie_target: float) -> dict:
    """Six-group servings for the guideline tier at or above the target."""
    if calorie_target <= 0:
        raise ValueError("calorie_target must be positive")
    for tier in sorted(TIERS):
        if calorie_target <= tier:
            return {"tier": tier, "servings": dict(TIERS[tier])}
    # 超過最高階梯：用最高階梯
    top = max(TIERS)
    return {"tier": top, "servings": dict(TIERS[top])}


def achievement(intake: dict, targets: dict) -> dict:
    """達成率：實際攝取 vs 目標份量，每類 0-100+%."""
    result = {}
    for group, target in targets.items():
        eaten = intake.get(group, 0.0)
        result[group] = round(eaten / target * 100.0, 1) if target else None
    return result


# 每份量對應公克數（粗估，國民飲食指南份量換算的簡化版）：
# 全榖雜糧 1 碗≈200g 熟飯；豆魚蛋肉 1 份≈35g 熟肉；乳品 1 杯≈240g；
# 蔬菜 1 份≈100g 生重；水果 1 份≈100g 可食部；油脂 1 茶匙≈5g
# （堅果併入油脂類，以 15g≈1 份概算——文件標明為粗估，供達成率參考）
GRAMS_PER_SERVING = {
    "grains": 200.0,
    "protein": 35.0,
    "dairy": 240.0,
    "vegetables": 100.0,
    "fruits": 100.0,
    "oils": 5.0,
}


def estimate_servings(meals: list) -> dict:
    """從餐點（{category, grams}）自動推估六大類份量.

    other 類不計；回傳 {grains: 碗, ...}（浮點）。粗估——與手動輸入並存，
    手動值優先.
    """
    totals = {}
    for meal in meals:
        cat = meal.get("category")
        grams = meal.get("grams", 0.0)
        if cat not in GRAMS_PER_SERVING or grams <= 0:
            continue
        totals[cat] = totals.get(cat, 0.0) + grams / GRAMS_PER_SERVING[cat]
    return {k: round(v, 2) for k, v in totals.items()}
