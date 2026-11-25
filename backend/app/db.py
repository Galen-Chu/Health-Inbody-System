"""Database session · SQLAlchemy."""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DB_URL

# pool_pre_ping：Neon 免費版閒置會休眠，取用連線前先探活，
# 避免冷喚醒期間的 stale connection 造成間歇性 500
engine = create_engine(DB_URL, pool_pre_ping=True,
                       connect_args={"check_same_thread": False}
                       if DB_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    import app.models  # noqa: F401 — register tables
    import app.models_food  # noqa: F401
    Base.metadata.create_all(engine)
