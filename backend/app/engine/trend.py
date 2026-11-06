"""Trend extrapolation · 體重趨勢外推（M6 前置·無 ML 版）.

Holt 雙參數指數平滑（level＋trend）：短序列可用、係數固定透明、
可解釋——比直接上 ML 更誠實的基準線。預測僅供參考，不構成建議.
"""


def holt_forecast(values: list, alpha: float = 0.5, beta: float = 0.3,
                  horizon: int = 14) -> list | None:
    """Holt's linear trend；回傳未來 horizon 步的預測值.

    alpha: level 平滑；beta: trend 平滑。序列 <3 點回 None
    （趨勢無從估計，寧可不出線也不亂猜）.
    """
    if len(values) < 3:
        return None
    level = values[0]
    trend = values[1] - values[0]
    for v in values[1:]:
        prev_level = level
        level = alpha * v + (1 - alpha) * (level + trend)
        trend = beta * (level - prev_level) + (1 - beta) * trend
    return [level + trend * h for h in range(1, horizon + 1)]


def forecast_with_dates(dates: list, values: list, horizon: int = 14,
                        step_days: int = 7):
    """配合量測日期（YYYY-MM-DD 字串）產出預測序列.

    step_days: 以歷史平均量測間隔為步長（身體量測通常非每日）.
    回傳 None（資料不足）或 [{date, value}, ...].
    """
    from datetime import date as date_type, timedelta

    forecast = holt_forecast(values, horizon=horizon)
    if forecast is None:
        return None
    parsed = [date_type.fromisoformat(d) for d in dates]
    gaps = [(b - a).days for a, b in zip(parsed, parsed[1:]) if (b - a).days > 0]
    step = step_days if not gaps else max(round(sum(gaps) / len(gaps)), 1)
    last = parsed[-1]
    return [{"date": (last + timedelta(days=step * h)).isoformat(),
             "value": round(v, 1)}
            for h, v in enumerate(forecast, 1)]
