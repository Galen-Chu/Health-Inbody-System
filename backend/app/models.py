"""ORM models · 個人資料、每日記錄、身體量測."""
from datetime import date as date_type

from sqlalchemy import Date, Float, Integer, String, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Profile(Base):
    """單人設定檔（v1 單人自用；id=1 為預設使用者）."""
    __tablename__ = "profile"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(64), default="")
    sex: Mapped[str] = mapped_column(String(10), default="male")
    height_cm: Mapped[float] = mapped_column(Float, default=0)
    weight_kg: Mapped[float] = mapped_column(Float, default=0)
    age: Mapped[int] = mapped_column(Integer, default=30)
    body_fat_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    activity: Mapped[str] = mapped_column(String(16), default="moderate")
    goal: Mapped[str] = mapped_column(String(12), default="maintain")


class DailyRecord(Base):
    """每日飲食與水分記錄；servings 存六大類份量 JSON."""
    __tablename__ = "daily_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    record_date: Mapped[date_type] = mapped_column(Date, index=True, unique=True)
    servings: Mapped[dict] = mapped_column(JSON, default=dict)
    water_ml: Mapped[int] = mapped_column(Integer, default=0)
    note: Mapped[str] = mapped_column(String(500), default="")


class BodyMetric(Base):
    """身體組成量測（InBody 風格：體重/體脂/肌肉量趨勢）."""
    __tablename__ = "body_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    measured_on: Mapped[date_type] = mapped_column(Date, index=True)
    weight_kg: Mapped[float] = mapped_column(Float)
    body_fat_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    muscle_mass_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
