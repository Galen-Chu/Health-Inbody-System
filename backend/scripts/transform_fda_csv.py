"""transform_fda_csv · 食藥署原始長格式 CSV → 本專案 schema CSV

食藥署「食品營養成分資料集」原始檔為長格式（每列＝一個食物×一個分析項，
21 萬餘列）。本腳本樞紐成每食物一列的 schema，並把 19 個官方分類
映射到國民飲食指南六大類（無法歸類者設 other）。

    cd backend
    python scripts/transform_fda_csv.py <原始20_2.csv> data/foods_full.csv

輸出欄位：source_id, name, category, category_zh,
          calories_kcal_per_100g, water_g_per_100g, protein_g, carb_g, fat_g
（單位皆為每 100g 可食部；熱量優先取「修正熱量」）
"""
import argparse
import csv
from collections import defaultdict
from pathlib import Path

# 19 個官方食品分類 → 六大類（grains/protein/dairy/vegetables/fruits/oils/other）
CATEGORY_MAP = {
    "穀物類": "grains", "澱粉類": "grains", "糕餅點心類": "grains", "糖類": "grains",
    "豆類": "protein", "魚貝類": "protein", "蛋類": "protein", "肉類": "protein",
    "乳品類": "dairy",
    "蔬菜類": "vegetables", "菇類": "vegetables", "藻類": "vegetables",
    "水果類": "fruits",
    "堅果及種子類": "oils", "油脂類": "oils",
    "加工調理食品類": "other", "調味料及香辛料類": "other", "嗜好性飲料類": "other",
}

# 分析項 → schema 欄位
METRIC_MAP = {
    "修正熱量": "calories_kcal_per_100g",
    "熱量": "calories_kcal_per_100g",   # fallback（修正熱量優先，後寫不覆蓋）
    "水分": "water_g_per_100g",
    "粗蛋白": "protein_g",
    "總碳水化合物": "carb_g",
    "粗脂肪": "fat_g",
}

CATEGORY_ZH = {
    "grains": "全榖雜糧類", "protein": "豆魚蛋肉類", "dairy": "乳品類",
    "vegetables": "蔬菜類", "fruits": "水果類",
    "oils": "油脂與堅果種子類", "other": "其他",
}


def parse_value(raw: str) -> float | None:
    """數值欄位清理：'<' 前綴（如 '<0.1'）取其值、'-'/'NR'/空 → None."""
    raw = (raw or "").strip()
    if not raw or raw in {"-", "NR", "NA", "N/A"}:
        return None
    try:
        return float(raw.lstrip("<").lstrip("＞").lstrip(">"))
    except ValueError:
        return None


def transform(source: Path, dest: Path) -> int:
    foods = {}  # source_id -> {field: value}
    meta = {}   # source_id -> (name, category)
    for row in csv.reader(open(source, encoding="utf-8-sig")):
        if row[0] == "食品分類":  # header
            continue
        category_zh, source_id, name, metric, value = row[0], row[2], row[3], row[9], row[11]
        meta[source_id] = (name, CATEGORY_MAP.get(category_zh, "other"))
        field = METRIC_MAP.get(metric)
        if field is None:
            continue
        parsed = parse_value(value)
        if parsed is None:
            continue
        slot = foods.setdefault(source_id, {})
        # 「熱量」只在沒有「修正熱量」時生效
        if field in slot and metric == "熱量":
            continue
        slot[field] = parsed

    with open(dest, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["source_id", "name", "category", "category_zh",
                         "calories_kcal_per_100g", "water_g_per_100g",
                         "protein_g", "carb_g", "fat_g"])
        for source_id in sorted(meta):
            name, category = meta[source_id]
            v = foods.get(source_id, {})
            writer.writerow([
                source_id, name, category, CATEGORY_ZH[category],
                v.get("calories_kcal_per_100g", ""),
                v.get("water_g_per_100g", ""),
                v.get("protein_g", ""),
                v.get("carb_g", ""),
                v.get("fat_g", ""),
            ])
    return len(meta)


def main():
    parser = argparse.ArgumentParser(description="食藥署長格式 CSV → schema CSV")
    parser.add_argument("source", type=Path)
    parser.add_argument("dest", type=Path)
    args = parser.parse_args()

    count = transform(args.source, args.dest)
    print(f"轉換完成：{count} 項食物 → {args.dest}")


if __name__ == "__main__":
    main()
