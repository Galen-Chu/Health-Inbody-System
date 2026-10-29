"""API routers · profile / records / metrics."""
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.engine import bmr as bmr_engine
from app.engine import six_groups, tdee as tdee_engine
from app.engine import water as water_engine
from app.models import BodyMetric, DailyRecord, Profile
from app.schemas import (BodyMetricIn, BodyMetricOut, DailyRecordIn,
                         DailyRecordOut, MetricsOut, ProfileIn, ProfileOut)

router = APIRouter(prefix="/api")

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


def _ensure_profile(db: Session) -> Profile:
    profile = db.scalar(select(Profile).where(Profile.id == 1))
    if profile is None:
        profile = Profile(id=1)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/profile", response_model=ProfileOut)
def get_profile(db: Session = Depends(get_db)):
    return _ensure_profile(db)


@router.put("/profile", response_model=ProfileOut)
def update_profile(data: ProfileIn, db: Session = Depends(get_db)):
    profile = _ensure_profile(db)
    for field, value in data.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/metrics", response_model=MetricsOut)
def get_metrics(db: Session = Depends(get_db)):
    profile = _ensure_profile(db)
    bfp = profile.body_fat_pct or None
    formula = "katch-mcardle" if bfp else "mifflin-st-jeor"
    bmr = bmr_engine.calc_bmr(profile.weight_kg, profile.height_cm,
                              profile.age, profile.sex, bfp)
    tdee = tdee_engine.calc_tdee(bmr, profile.activity, profile.goal)
    return MetricsOut(
        bmr=round(bmr, 1),
        formula=formula,
        tdee=round(tdee, 1),
        calorie_target=round(tdee, 1),  # 目標熱量＝goal 調整後的 TDEE
        water_target_ml=water_engine.daily_target_ml(profile.weight_kg),
        six_groups=six_groups.daily_targets(tdee),
    )


@router.get("/records", response_model=list[DailyRecordOut])
def list_records(start: date | None = None, end: date | None = None,
                 db: Session = Depends(get_db)):
    stmt = select(DailyRecord).order_by(DailyRecord.record_date.desc()).limit(90)
    if start:
        stmt = stmt.where(DailyRecord.record_date >= start)
    if end:
        stmt = stmt.where(DailyRecord.record_date <= end)
    return list(db.scalars(stmt))


@router.post("/records", response_model=DailyRecordOut)
def upsert_record(data: DailyRecordIn, db: Session = Depends(get_db)):
    """同日重寫（upsert）——每日一筆，最後填寫為準."""
    record = db.scalar(select(DailyRecord)
                       .where(DailyRecord.record_date == data.record_date))
    if record is None:
        record = DailyRecord(record_date=data.record_date)
        db.add(record)
    for field, value in data.model_dump().items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.get("/records/{record_date}", response_model=DailyRecordOut)
def get_record(record_date: date, db: Session = Depends(get_db)):
    record = db.scalar(select(DailyRecord)
                       .where(DailyRecord.record_date == record_date))
    if record is None:
        raise HTTPException(404, "record not found")
    return record


@router.post("/body-metrics", response_model=BodyMetricOut)
def add_body_metric(data: BodyMetricIn, db: Session = Depends(get_db)):
    metric = BodyMetric(**data.model_dump())
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric


@router.get("/body-metrics", response_model=list[BodyMetricOut])
def list_body_metrics(db: Session = Depends(get_db)):
    return list(db.scalars(select(BodyMetric)
                           .order_by(BodyMetric.measured_on.desc()).limit(365)))
