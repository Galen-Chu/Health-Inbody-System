"""Six-groups and water engine tests."""
import pytest

from app.engine.six_groups import GROUPS, TIERS, achievement, daily_targets
from app.engine.water import daily_target_ml, food_water_ml


class TestDailyTargets:
    def test_tier_at_or_above_target(self):
        result = daily_targets(2448)
        assert result["tier"] == 2500

    def test_low_target_lowest_tier(self):
        assert daily_targets(1100)["tier"] == 1200

    def test_above_top_tier_clamps(self):
        assert daily_targets(3000)["tier"] == max(TIERS)

    def test_servings_have_all_six_groups(self):
        result = daily_targets(1800)["servings"]
        assert set(result) == set(GROUPS)

    def test_invalid_target_raises(self):
        with pytest.raises(ValueError):
            daily_targets(0)


class TestAchievement:
    def test_ratio_percent(self):
        result = achievement({"grains": 2}, {"grains": 3, "protein": 4})
        assert result["grains"] == pytest.approx(66.7)
        assert result["protein"] == 0.0

    def test_over_100_percent(self):
        assert achievement({"grains": 4}, {"grains": 3})["grains"] == pytest.approx(133.3)


class TestWater:
    def test_daily_target(self):
        assert daily_target_ml(70) == 2450

    def test_invalid_weight(self):
        with pytest.raises(ValueError):
            daily_target_ml(0)

    def test_food_water(self):
        foods = [{"water_g_per_100g": 90, "grams": 200}]  # e.g. 西瓜 200g
        assert food_water_ml(foods) == pytest.approx(180.0)

    def test_empty_food_list(self):
        assert food_water_ml([]) == 0.0
