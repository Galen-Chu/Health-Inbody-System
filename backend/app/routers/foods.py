"""Foods & meals router · 食物搜尋、餐點記錄、每日彙總."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Profile
from app.models_food import Food, MealEntry
from app.schemas import MetricsOut

router = APIRouter(prefix="/api")

VALID_CATEGORIES = {"grains", "protein", "dairy", "vegetables", "fruits", "oils", "other"}


class FoodOut(BaseModel):
    id: int
    source_id: str | None = None
    name: str
    category: str
    category_zh: str | None = None
    calories_kcal_per_100g: float
    water_g_per_100g: float
    protein_g: float
    carb_g: float
    fat_g: float

    class Config:
        from_attributes = True


class MealIn(BaseModel):
    record_date: date
    food_id: int
    grams: float = Field(gt=0, le=5000)
    meal: str = "any"


class MealOut(MealIn):
    id: int
    food_name: str
    calories_kcal: float
    water_g: float
    protein_g: float
    carb_g: float
    fat_g: float

    class Config:
        from_attributes = True


class DaySummary(BaseModel):
    date: date
    calories_total: float
    calorie_target: float
    water_from_food_ml: float
    water_drink_ml: int
    macros: dict          # {protein_g, carb_g, fat_g}
    meals: list[MealOut]


@router.get("/foods", response_model=list[FoodOut])
def search_foods(
    q: str = Query(default="", max_length=40),
    category: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """食物搜尋（名稱模糊比對，可限六大類）."""
    stmt = select(Food)
    if q:
        stmt = stmt.where(Food.name.like(f"%{q}%"))
    if category:
        if category not in VALID_CATEGORIES:
            raise HTTPException(422, f"unknown category: {category}")
        stmt = stmt.where(Food.category == category)
    return list(db.scalars(stmt.order_by(Food.id).limit(limit)))


@router.get("/foods/{food_id}", response_model=FoodOut)
def get_food(food_id: int, db: Session = Depends(get_db)):
    food = db.get(Food, food_id)
    if food is None:
        raise HTTPException(404, "food not found")
    return food


def _entry_from(food: Food, data: MealIn) -> MealEntry:
    scale = data.grams / 100.0
    return MealEntry(
        record_date=data.record_date, meal=data.meal,
        food_id=food.id, food_name=food.name, grams=data.grams,
        calories_kcal=round(food.calories_kcal_per_100g * scale, 1),
        water_g=round(food.water_g_per_100g * scale, 1),
        protein_g=round(food.protein_g * scale, 1),
        carb_g=round(food.carb_g * scale, 1),
        fat_g=round(food.fat_g * scale, 1),
    )


@router.post("/meals", response_model=MealOut)
def add_meal(data: MealIn, db: Session = Depends(get_db)):
    """記錄一筆餐點（food × 公克），營養值自動換算並快照."""
    food = db.get(Food, data.food_id)
    if food is None:
        raise HTTPException(404, "food not found")
    entry = _entry_from(food, data)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/meals/{entry_id}", status_code=204)
def delete_meal(entry_id: int, db: Session = Depends(get_db)):
    entry = db.get(MealEntry, entry_id)
    if entry is None:
        raise HTTPException(404, "meal entry not found")
    db.delete(entry)
    db.commit()


@router.get("/meals", response_model=list[MealOut])
def list_meals(day: date, db: Session = Depends(get_db)):
    return list(db.scalars(select(MealEntry)
                           .where(MealEntry.record_date == day)
                           .order_by(MealEntry.id)))


@router.get("/summary/{day}", response_model=DaySummary)
def day_summary(day: date, db: Session = Depends(get_db)):
    """當日總覽：餐點熱量/巨量營養/食物水分 vs 目標."""
    entries = list(db.scalars(select(MealEntry)
                              .where(MealEntry.record_date == day)
                              .order_by(MealEntry.id)))

    from app.routers.api import _ensure_profile
    from app.engine import bmr as bmr_engine, tdee as tdee_engine
    profile = _ensure_profile(db)
    bmr = bmr_engine.calc_bmr(profile.weight_kg, profile.height_cm, profile.age,
                              profile.sex, profile.body_fat_pct or None)
    target = tdee_engine.calc_tdee(bmr, profile.activity, profile.goal)

    from app.models import DailyRecord
    record = db.scalar(select(DailyRecord).where(DailyRecord.record_date == day))

    return DaySummary(
        date=day,
        calories_total=round(sum(e.calories_kcal for e in entries), 1),
        calorie_target=round(target, 1),
        water_from_food_ml=round(sum(e.water_g for e in entries), 0),
        water_drink_ml=record.water_ml if record else 0,
        macros={
            "protein_g": round(sum(e.protein_g for e in entries), 1),
            "carb_g": round(sum(e.carb_g for e in entries), 1),
            "fat_g": round(sum(e.fat_g for e in entries), 1),
        },
        meals=entries,
    )
