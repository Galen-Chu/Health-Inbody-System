"""import_foods · CSV → SQLite 食物資料表（M2b 資料匯入工具）

用法：
    cd backend
    python scripts/import_foods.py data/foods_sample.csv

欄位契約：name, category(六大類 key), calories_kcal_per_100g,
water_g_per_100g, protein_g, carb_g, fat_g
（完整資料來源：食藥署食品營養成分資料庫，單位為每 100g 可食部）
"""
import argparse
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import engine  # noqa: E402

COLUMNS = ["name", "category", "calories_kcal_per_100g",
           "water_g_per_100g", "protein_g", "carb_g", "fat_g"]
VALID_CATEGORIES = {"grains", "protein", "dairy", "vegetables", "fruits", "oils"}


def import_csv(csv_path: Path) -> int:
    df = pd.read_csv(csv_path)
    missing = [c for c in COLUMNS if c not in df.columns]
    if missing:
        raise SystemExit(f"CSV 缺欄位：{missing}")

    bad = set(df["category"].dropna().unique()) - VALID_CATEGORIES
    if bad:
        raise SystemExit(f"未知六大類代碼：{bad}")

    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS foods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                calories_kcal_per_100g REAL NOT NULL,
                water_g_per_100g REAL DEFAULT 0,
                protein_g REAL DEFAULT 0,
                carb_g REAL DEFAULT 0,
                fat_g REAL DEFAULT 0
            )"""))
        conn.execute(text("DELETE FROM foods"))
        conn.execute(text("""
            INSERT INTO foods (name, category, calories_kcal_per_100g,
                               water_g_per_100g, protein_g, carb_g, fat_g)
            VALUES (:name, :category, :calories_kcal_per_100g,
                    :water_g_per_100g, :protein_g, :carb_g, :fat_g)"""),
            df[COLUMNS].to_dict("records"))
    return len(df)


def main():
    parser = argparse.ArgumentParser(description="CSV → SQLite foods 匯入")
    parser.add_argument("csv", type=Path, help="食物 CSV 路徑")
    args = parser.parse_args()

    count = import_csv(args.csv)
    print(f"已匯入 {count} 筆食物資料")


if __name__ == "__main__":
    main()
