"""BMR engine tests — 數值對照原專案公式手算基準值."""
import pytest

from app.engine.bmr import calc_bmr, katch_mcardle, mifflin_st_jeor


class TestKatchMcArdle:
    def test_standard_male_with_bfp(self):
        # LBM = 70 × 0.8 = 56 → 370 + 21.6×56 = 1579.6
        assert katch_mcardle(70, 20) == pytest.approx(1579.6)

    def test_zero_bfp_excluded_by_auto_selection(self):
        # bfp=0（未量測的預設值）應走 Mifflin 而非 Katch-McArdle
        result = calc_bmr(70, 175, 30, "male", body_fat_pct=0)
        assert result == pytest.approx(mifflin_st_jeor(70, 175, 30, "male"))


class TestMifflinStJeor:
    def test_male(self):
        # 700 + 1093.75 - 150 + 5 = 1648.75
        assert mifflin_st_jeor(70, 175, 30, "male") == pytest.approx(1648.75)

    def test_female(self):
        # 550 + 1000 - 140 - 161 = 1249
        assert mifflin_st_jeor(55, 160, 28, "female") == pytest.approx(1249.0)


class TestCalcBmr:
    def test_bfp_known_uses_katch(self):
        assert calc_bmr(70, 175, 30, "male", body_fat_pct=20) == pytest.approx(1579.6)

    def test_bfp_none_uses_mifflin(self):
        assert calc_bmr(70, 175, 30, "male") == pytest.approx(1648.75)
