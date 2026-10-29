"""Food & meal logging models · 食物資料庫與餐點記錄.

MealEntry 快照營養數值（食物資料庫重新匯入後歷史記錄不變）.
"""
from datetime import date as date_type

from sqlalchemy import Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Food(Base):
    """食藥署食品營養成分資料集（每 100g 可食部）."""
    __tablename__ = "foods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    name: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(16))          # 六大類 key 或 other
    category_zh: Mapped[str | None] = mapped_column(Text, nullable=True)
    calories_kcal_per_100g: Mapped[float] = mapped_column(Float)
    water_g_per_100g: Mapped[float] = mapped_column(Float, default=0)
    protein_g: Mapped[float] = mapped_column(Float, default=0)
    carb_g: Mapped[float] = mapped_column(Float, default=0)
    fat_g: Mapped[float] = mapped_column(Float, default=0)


class MealEntry(Base):
    """一筆餐點記錄：food × 公克數，數值已按比例換算並快照."""
    __tablename__ = "meal_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    record_date: Mapped[date_type] = mapped_column(Date, index=True)
    meal: Mapped[str] = mapped_column(String(16), default="any")  # breakfast/lunch/dinner/snack/any
    food_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("foods.id"), nullable=True)
    food_name: Mapped[str] = mapped_column(Text)
    grams: Mapped[float] = mapped_column(Float)
    calories_kcal: Mapped[float] = mapped_column(Float)
    water_g: Mapped[float] = mapped_column(Float)
    protein_g: Mapped[float] = mapped_column(Float)
    carb_g: Mapped[float] = mapped_column(Float)
    fat_g: Mapped[float] = mapped_column(Float)
