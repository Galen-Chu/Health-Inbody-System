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
