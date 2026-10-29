"""BMR engine · 基礎代謝率計算

Formulas ported from the original tkinter project (2024), with the
no-body-fat fallback formalized as Mifflin-St Jeor.
"""


def katch_mcardle(weight_kg: float, body_fat_pct: float) -> float:
    """Katch-McArdle — most accurate when body fat % is known (InBody)."""
    lean_mass = weight_kg * (100.0 - body_fat_pct) / 100.0
    return 370.0 + 21.6 * lean_mass


def mifflin_st_jeor(weight_kg: float, height_cm: float, age: int, sex: str) -> float:
    """Mifflin-St Jeor — fallback when body fat % is unknown."""
    base = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age
    return base + 5.0 if sex == "male" else base - 161.0


def calc_bmr(
    weight_kg: float,
    height_cm: float,
    age: int,
    sex: str,
    body_fat_pct: float | None = None,
) -> float:
    """BMR with auto formula selection: Katch-McArdle when BFP is known."""
    if body_fat_pct:
        return katch_mcardle(weight_kg, body_fat_pct)
    return mifflin_st_jeor(weight_kg, height_cm, age, sex)
