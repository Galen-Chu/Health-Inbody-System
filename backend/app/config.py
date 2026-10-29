"""App configuration · 環境變數可覆寫（本機預設 SQLite，上雲換 DB_URL）."""
import os

DB_URL = os.environ.get("HIS_DB_URL", "sqlite:///./health_inbody.db")
HOST = os.environ.get("HIS_HOST", "127.0.0.1")
PORT = int(os.environ.get("HIS_PORT", "8000"))
