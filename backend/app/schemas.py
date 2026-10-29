"""Pydantic schemas (API 合約)."""
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Sex = Literal["male", "female"]
Activity = Literal["sedentary", "light", "moderate", "high", "athlete"]
Goal = Literal["cut", "maintain", "bulk"]
GroupKey = Literal["grains", "protein", "dairy", "vegetables", "fruits", "oils"]


class ProfileIn(BaseModel):
    name: str = ""
    sex: Sex = "male"
    height_cm: float = Field(gt=0, le=250)
    weight_kg: float = Field(gt=0, le=300)
    age: int = Field(gt=0, le=120)
    body_fat_pct: Optional[float] = Field(default=None, ge=0, le=70)
    activity: Activity = "moderate"
    goal: Goal = "maintain"


class ProfileOut(ProfileIn):
    id: int

    model_config = ConfigDict(from_attributes=True)


class DailyRecordIn(BaseModel):
    record_date: date
    servings: dict[GroupKey, float] = {}
    water_ml: int = Field(default=0, ge=0)
    note: str = ""


class DailyRecordOut(DailyRecordIn):
    id: int

    model_config = ConfigDict(from_attributes=True)


class BodyMetricIn(BaseModel):
    measured_on: date
    weight_kg: float = Field(gt=0, le=300)
    body_fat_pct: Optional[float] = Field(default=None, ge=0, le=70)
    muscle_mass_kg: Optional[float] = Field(default=None, gt=0, le=300)


class BodyMetricOut(BodyMetricIn):
    id: int

    model_config = ConfigDict(from_attributes=True)


class MetricsOut(BaseModel):
    """引擎計算結果總覽."""
    bmr: float
    formula: str
    tdee: float
    calorie_target: float
    water_target_ml: int
    six_groups: dict
