"""API routers · profile / records / metrics."""
import json
from datetime import date, datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.engine import bmr as bmr_engine
from app.engine import six_groups, tdee as tdee_engine
from app.engine import water as water_engine
from app.models import BodyMetric, DailyRecord, Profile
from app.models_food import MealEntry
from app.schemas import (BodyMetricIn, BodyMetricOut, DailyRecordIn,
                         DailyRecordOut, MetricsNotReady, MetricsOut,
                         ProfileIn, ProfileOut)

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


@router.get("/metrics", response_model=MetricsOut | MetricsNotReady)
def get_metrics(db: Session = Depends(get_db)):
    profile = _ensure_profile(db)
    # 未填齊（或性別打錯）→ 引擎無法計算：回「未就緒」讓前端引導，而非 500
    missing = []
    for f in ("height_cm", "weight_kg", "age"):
        if not getattr(profile, f):
            missing.append(f)
    if profile.sex not in ("male", "female"):
        missing.append("sex")
    if missing:
        return MetricsNotReady(missing=missing)
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
    """新增量測；同日重複記錄視為修正（upsert），趨勢圖一日一點."""
    metric = db.scalar(select(BodyMetric)
                       .where(BodyMetric.measured_on == data.measured_on))
    if metric is None:
        metric = BodyMetric(**data.model_dump())
        db.add(metric)
    else:
        for field, value in data.model_dump().items():
            setattr(metric, field, value)
    db.commit()
    db.refresh(metric)
    return metric


@router.get("/body-metrics", response_model=list[BodyMetricOut])
def list_body_metrics(db: Session = Depends(get_db)):
    return list(db.scalars(select(BodyMetric)
                           .order_by(BodyMetric.measured_on.desc()).limit(365)))


@router.get("/trend/weight")
def weight_trend(metric: str = "weight_kg", horizon: int = 14,
                 db: Session = Depends(get_db)):
    """身體組成趨勢＋Holt 外推（metric: weight_kg|body_fat_pct|muscle_mass_kg）."""
    from app.engine.trend import forecast_with_dates

    if metric not in ("weight_kg", "body_fat_pct", "muscle_mass_kg"):
        raise HTTPException(422, f"unknown metric: {metric}")

    metrics = list(db.scalars(select(BodyMetric)
                              .order_by(BodyMetric.measured_on)))
    history = [{"date": m.measured_on.isoformat(),
                "value": getattr(m, metric)}
               for m in metrics if getattr(m, metric) is not None]
    forecast = forecast_with_dates(
        [h["date"] for h in history], [h["value"] for h in history],
        horizon=horizon)
    return {"history": history, "forecast": forecast,
            "method": "holt-linear" if forecast else "insufficient-data"}


@router.get("/export")
def export_data(format: str = "json", db: Session = Depends(get_db)):
    """全量資料匯出（M7 前置）：json=單一檔；csv=四表 zip."""
    import io
    import zipfile

    from fastapi.responses import Response

    profile = db.scalar(select(Profile).where(Profile.id == 1))
    metrics = list(db.scalars(select(BodyMetric)
                              .order_by(BodyMetric.measured_on)))
    meals = list(db.scalars(select(MealEntry)
                            .order_by(MealEntry.record_date, MealEntry.id)))
    records = list(db.scalars(select(DailyRecord)
                              .order_by(DailyRecord.record_date)))

    if format == "json":
        dump = {
            "exported_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "profile": {c.name: getattr(profile, c.name) for c in profile.__table__.columns} if profile else None,
            "body_metrics": [{c.name: str(getattr(m, c.name)) if c.name == "measured_on"
                              else getattr(m, c.name) for c in m.__table__.columns} for m in metrics],
            "meals": [{c.name: str(getattr(e, c.name)) if c.name == "record_date"
                       else getattr(e, c.name) for c in e.__table__.columns} for e in meals],
            "daily_records": [{c.name: str(getattr(r, c.name)) if c.name == "record_date"
                               else getattr(r, c.name) for c in r.__table__.columns} for r in records],
        }
        return Response(
            json.dumps(dump, ensure_ascii=False, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": 'attachment; filename="his_export.json"'})

    if format == "csv":
        import csv as csv_mod
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for name, rows, cols in (
                    ("body_metrics", metrics, ["measured_on", "weight_kg", "body_fat_pct", "muscle_mass_kg"]),
                    ("meals", meals, ["record_date", "meal", "food_name", "grams",
                                      "calories_kcal", "protein_g", "carb_g", "fat_g"]),
                    ("daily_records", records, ["record_date", "servings", "water_ml", "note"])):
                s = io.StringIO()
                writer = csv_mod.writer(s)
                writer.writerow(cols)
                for row in rows:
                    writer.writerow([str(getattr(row, c)) for c in cols])
                zf.writestr(f"his_{name}.csv", s.getvalue())
        return Response(
            buf.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": 'attachment; filename="his_export.zip"'})

    raise HTTPException(422, f"unknown format: {format} (json|csv)")


@router.post("/import")
def import_data(payload: dict = Body(...),
                mode: str = Query(default="merge", pattern="^(merge|replace)$"),
                db: Session = Depends(get_db)):
    """還原 /api/export?format=json 的備份（冪等——同一檔重複匯入結果相同）.

    mode=merge（預設）：profile 覆寫；三表以「日期」為單位合併——備份中出現
    的日期取代現有同日資料（同每日 upsert 模型），未出現的日期不動。
    mode=replace：清空量測/每日記錄/餐點三表後整檔寫入；食物資料庫不動。
    """
    if not any(k in payload for k in ("profile", "body_metrics", "meals", "daily_records")):
        raise HTTPException(422, "不是 /api/export 的備份檔——缺少 profile/body_metrics/meals/daily_records")

    def _d(v):
        try:
            return v if isinstance(v, date) else date.fromisoformat(str(v))
        except ValueError:
            raise HTTPException(422, f"備份檔內有無效日期：{v}")

    if mode == "replace":
        for table in (MealEntry, DailyRecord, BodyMetric):
            db.execute(delete(table))

    if payload.get("profile"):
        profile = _ensure_profile(db)
        for col in profile.__table__.columns:
            if col.name != "id" and col.name in payload["profile"]:
                setattr(profile, col.name, payload["profile"][col.name])

    counts = {"body_metrics": 0, "daily_records": 0, "meals": 0, "days_overwritten": 0}
    for row in payload.get("body_metrics") or []:
        metric = db.scalar(select(BodyMetric)
                           .where(BodyMetric.measured_on == _d(row["measured_on"])))
        if metric is None:
            metric = BodyMetric(measured_on=_d(row["measured_on"]))
            db.add(metric)
        for f in ("weight_kg", "body_fat_pct", "muscle_mass_kg"):
            if f in row:
                setattr(metric, f, row[f])
        counts["body_metrics"] += 1

    for row in payload.get("daily_records") or []:
        record = db.scalar(select(DailyRecord)
                           .where(DailyRecord.record_date == _d(row["record_date"])))
        if record is None:
            record = DailyRecord(record_date=_d(row["record_date"]))
            db.add(record)
        for f in ("servings", "water_ml", "note"):
            if f in row:
                setattr(record, f, row[f])
        counts["daily_records"] += 1

    meal_rows = payload.get("meals") or []
    if mode == "merge" and meal_rows:
        # 餐點無自然唯一鍵（同日多筆）→ 以日期為單位整段換掉，與 upsert 模型一致
        days = {str(r["record_date"]) for r in meal_rows}
        for d in days:
            db.execute(delete(MealEntry).where(MealEntry.record_date == _d(d)))
        counts["days_overwritten"] = len(days)
    for row in meal_rows:
        db.add(MealEntry(
            record_date=_d(row["record_date"]), meal=row.get("meal", "any"),
            food_id=row.get("food_id"), food_name=row.get("food_name", ""),
            grams=row.get("grams", 0), calories_kcal=row.get("calories_kcal", 0),
            water_g=row.get("water_g", 0), protein_g=row.get("protein_g", 0),
            carb_g=row.get("carb_g", 0), fat_g=row.get("fat_g", 0)))
        counts["meals"] += 1

    db.commit()
    return {"mode": mode, **counts}
