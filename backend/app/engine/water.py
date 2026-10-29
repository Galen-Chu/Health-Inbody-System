"""Water engine · 水分目標與估算

Daily water target from body weight; food-water contribution is
estimated from recorded foods (per-100g water content).
"""


def daily_target_ml(weight_kg: float) -> int:
    """每日飲水目標：35 ml/kg（國健署建議 30-35 ml/kg 取上限）."""
    if weight_kg <= 0:
        raise ValueError("weight_kg must be positive")
    return round(weight_kg * 35)


def food_water_ml(foods: list) -> float:
    """食物含水量估算（ml≈g）。

    foods: [{"water_g_per_100g": float, "grams": float}, ...]
    """
    return round(sum(
        f.get("water_g_per_100g", 0.0) / 100.0 * f.get("grams", 0.0)
        for f in foods
    ), 1)
