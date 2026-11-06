"""趨勢外推引擎測試——已知序列的數學行為."""
from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.engine.trend import forecast_with_dates, holt_forecast
from app.main import app

client = TestClient(app)
client_get = client.get
client_post = client.post


class TestHoltForecast:
    def test_constant_series_stays_flat(self):
        # 完美平線 → 預測應維持在原值附近（趨勢≈0）
        out = holt_forecast([70.0] * 8, horizon=5)
        assert all(abs(v - 70.0) < 0.5 for v in out)
        assert len(out) == 5

    def test_linear_series_continues_slope(self):
        # 穩定下降 0.2/步 → 預測應延續下降趨勢
        series = [72.0 - 0.2 * i for i in range(10)]   # 72.0 → 70.2
        out = holt_forecast(series, horizon=3)
        # 一步後的預測應 < 最後觀測值，且持續遞減
        assert out[0] < series[-1]
        assert out[1] < out[0] < out[0] + 1
        assert out[2] < out[1]

    def test_short_series_returns_none(self):
        assert holt_forecast([70.0, 69.8]) is None
        assert holt_forecast([]) is None

    def test_horizon_respected(self):
        out = holt_forecast([70 + 0.1 * i for i in range(6)], horizon=7)
        assert len(out) == 7


class TestForecastWithDates:
    def _series(self, days=6, start=date(2026, 10, 1), base=72.0):
        dates = [(start + timedelta(days=7 * i)).isoformat() for i in range(days)]
        values = [round(base - 0.2 * i, 1) for i in range(days)]
        return dates, values

    def test_produces_dated_forecast(self):
        dates, values = self._series()
        out = forecast_with_dates(dates, values, horizon=3)
        assert out is not None and len(out) == 3
        # 步長取歷史平均間隔（7 天）
        assert out[0]["date"] == "2026-11-12"   # 10-29 + 7（第 6 點是 11-05? 見下）
        for item in out:
            assert set(item) == {"date", "value"}

    def test_insufficient_data_none(self):
        assert forecast_with_dates(["2026-10-01"], [70.0]) is None


def test_trend_endpoint():
    resp = client_get("/api/trend/weight")
    assert resp.status_code == 200
    data = resp.json()
    assert data["method"] in {"holt-linear", "insufficient-data"}
    assert isinstance(data["history"], list)
    # 測試 DB 已有 2026-10-01/15 兩筆 body metrics（test_api）
    # 加第三筆後應有預測
    client_post("/api/body-metrics", json={
        "measured_on": "2026-10-28", "weight_kg": 70.2})
    data = client_get("/api/trend/weight").json()
    assert data["method"] == "holt-linear"
    assert data["forecast"] and len(data["forecast"]) == 14
