"""TDEE engine · 每日總消耗熱量

TDEE = BMR × activity factor, then adjusted by goal.
"""

# 活動係數（久坐 → 高强度每天訓練）
ACTIVITY_FACTORS = {
    "sedentary": 1.2,     # 久坐，幾乎不動
    "light": 1.375,       # 輕度活動（每週 1-3 次）
    "moderate": 1.55,     # 中度活動（每週 3-5 次）
    "high": 1.725,        # 高度活動（每週 6-7 次）
    "athlete": 1.9,       # 高強度體力勞動＋天天訓練
}

# 目標調整係數
GOAL_FACTORS = {
    "cut": 0.8,           # 減脂：-20%
    "maintain": 1.0,      # 維持
    "bulk": 1.1,          # 增肌：+10%
}


def calc_tdee(bmr: float, activity: str = "moderate", goal: str = "maintain") -> float:
    """TDEE = BMR × activity × goal adjustment."""
    if activity not in ACTIVITY_FACTORS:
        raise ValueError(f"unknown activity: {activity}")
    if goal not in GOAL_FACTORS:
        raise ValueError(f"unknown goal: {goal}")
    return bmr * ACTIVITY_FACTORS[activity] * GOAL_FACTORS[goal]
