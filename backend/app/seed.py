"""seed · 首次啟動自動載入食物資料（foods 表空且 CSV 存在時）."""
import csv
from pathlib import Path

from sqlalchemy import func, select

from app.db import SessionLocal
from app.models_food import Food

DATA_CSV = Path(__file__).resolve().parent.parent / "data" / "foods_full.csv"


def seed_foods_if_empty() -> int:
    """回傳匯入筆數（0＝已有資料或無 CSV）."""
    if not DATA_CSV.is_file():
        return 0
    db = SessionLocal()
    try:
        count = db.scalar(select(func.count(Food.id)))
        if count:
            return 0
        with open(DATA_CSV, encoding="utf-8") as f:
            rows = []
            for r in csv.DictReader(f):
                rows.append(Food(
                    source_id=r["source_id"] or None,
                    name=r["name"],
                    category=r["category"],
                    category_zh=r["category_zh"] or None,
                    calories_kcal_per_100g=float(r["calories_kcal_per_100g"] or 0),
                    water_g_per_100g=float(r["water_g_per_100g"] or 0),
                    protein_g=float(r["protein_g"] or 0),
                    carb_g=float(r["carb_g"] or 0),
                    fat_g=float(r["fat_g"] or 0),
                ))
            db.add_all(rows)
            db.commit()
            return len(rows)
    finally:
        db.close()
