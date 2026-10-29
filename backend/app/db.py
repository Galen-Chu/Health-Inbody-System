"""Database session · SQLAlchemy."""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DB_URL

engine = create_engine(DB_URL, connect_args={"check_same_thread": False}
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
    Base.metadata.create_all(engine)
