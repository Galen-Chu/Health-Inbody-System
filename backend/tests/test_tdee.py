"""TDEE engine tests."""
import pytest

from app.engine.tdee import ACTIVITY_FACTORS, GOAL_FACTORS, calc_tdee


def test_moderate_maintain():
    assert calc_tdee(1600, "moderate", "maintain") == pytest.approx(1600 * 1.55)


def test_cut_reduces_20_percent():
    assert calc_tdee(2000, "sedentary", "cut") == pytest.approx(2000 * 1.2 * 0.8)


def test_bulk_adds_10_percent():
    assert calc_tdee(2000, "high", "bulk") == pytest.approx(2000 * 1.725 * 1.1)


def test_unknown_activity_raises():
    with pytest.raises(ValueError):
        calc_tdee(1600, "extreme")


def test_unknown_goal_raises():
    with pytest.raises(ValueError):
        calc_tdee(1600, "moderate", "recomp")


def test_factor_tables_complete():
    assert set(ACTIVITY_FACTORS) == {"sedentary", "light", "moderate", "high", "athlete"}
    assert set(GOAL_FACTORS) == {"cut", "maintain", "bulk"}
