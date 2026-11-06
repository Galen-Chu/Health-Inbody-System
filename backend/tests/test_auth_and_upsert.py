"""Token 認證（Issue #1 決策 2·方案 B）與 body-metrics upsert 測試."""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture
def with_token(monkeypatch):
    monkeypatch.setenv("HIS_API_TOKEN", "test-secret-123")
    yield "test-secret-123"
    monkeypatch.delenv("HIS_API_TOKEN", raising=False)


class TestTokenAuth:
    def test_no_token_env_means_open(self):
        # 未設定 HIS_API_TOKEN（conftest 環境）→ 全部開放（本機開發模式）
        assert client.get("/api/profile").status_code == 200

    def test_missing_header_401(self, with_token):
        assert client.get("/api/profile").status_code == 401

    def test_wrong_token_401(self, with_token):
        resp = client.get("/api/profile",
                          headers={"Authorization": "Bearer wrong"})
        assert resp.status_code == 401
        assert "unauthorized" in resp.json()["detail"]

    def test_correct_token_200(self, with_token):
        resp = client.get("/api/profile",
                          headers={"Authorization": f"Bearer {with_token}"})
        assert resp.status_code == 200

    def test_health_endpoint_stays_open(self, with_token):
        # 平台健康檢查不應被認證擋住
        assert client.get("/api/health").status_code == 200


class TestBodyMetricUpsert:
    def test_same_day_updates_not_duplicates(self):
        day = "2027-03-01"
        for weight in (72.0, 71.6):
            resp = client.post("/api/body-metrics", json={
                "measured_on": day, "weight_kg": weight})
            assert resp.status_code == 200
            assert resp.json()["weight_kg"] == weight

        entries = [m for m in client.get("/api/body-metrics").json()
                   if m["measured_on"] == day]
        assert len(entries) == 1                 # 同日只有一筆
        assert entries[0]["weight_kg"] == 71.6   # 值為最後修正
