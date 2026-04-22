"""
health_profile.py
-----------------
Computes TDEE, meal-level caloric targets, and macro targets
from manual profile input and optional wearable data.

NHANES WWEIA 2021-2023 meal fractions (Tables 13, 17, 21, 25):
  breakfast 18%, lunch 24%, dinner 35%, snack 23%

Weekly goal → caloric adjustment:
  1 kg body mass ≈ 7700 kcal
  deficit/surplus per day = weekly_goal_kg × 7700 / 7
  weight_loss  → negative adjustment (deficit)
  muscle_gain  → positive adjustment (surplus)
  maintenance  → zero adjustment
"""

from models import ManualProfileInput, WearableData, HealthProfile

# NHANES WWEIA 2021-2023 observed meal energy fractions
NHANES_MEAL_FRACTIONS = {
    "breakfast": 0.18,
    "lunch":     0.24,
    "dinner":    0.35,
    "snack":     0.23,
}

# Activity multipliers for Mifflin-St Jeor
ACTIVITY_MULTIPLIERS = {
    "sedentary":   1.2,
    "light":       1.375,
    "moderate":    1.55,
    "active":      1.725,
    "very_active": 1.9,
}

# Macro split ratios by goal (protein%, carbs%, fat%)
MACRO_SPLITS = {
    "weight_loss":  {"protein": 0.35, "carbs": 0.40, "fat": 0.25},
    "maintenance":  {"protein": 0.25, "carbs": 0.50, "fat": 0.25},
    "muscle_gain":  {"protein": 0.40, "carbs": 0.40, "fat": 0.20},
}

# Caloric value per gram
KCAL_PER_G = {"protein": 4, "carbs": 4, "fat": 9}


def compute_bmr(manual: ManualProfileInput) -> float:
    """Mifflin-St Jeor BMR equation."""
    if manual.sex == "male":
        return 10 * manual.weight_kg + 6.25 * manual.height_cm - 5 * manual.age + 5
    return 10 * manual.weight_kg + 6.25 * manual.height_cm - 5 * manual.age - 161


def compute_weekly_adjustment(manual: ManualProfileInput) -> int:
    """
    Converts weekly_goal_kg to daily caloric adjustment.
    1 kg/week = 7700 kcal / 7 days = 1100 kcal/day
    Weight loss → deficit (negative)
    Muscle gain → surplus (positive)
    Maintenance → zero
    """
    if manual.goal == "maintenance":
        return 0

    daily_adjustment = round(manual.weekly_goal_kg * 7700 / 7)

    if manual.goal == "weight_loss":
        return -daily_adjustment
    elif manual.goal == "muscle_gain":
        return daily_adjustment
    return 0


from typing import Optional

def build_health_profile(
    manual: ManualProfileInput,
    wearable: Optional[WearableData] = None,
) -> HealthProfile:

    # Step 1 — Compute TDEE
    if wearable:
        wearable_tdee = wearable.active_calories_burned + wearable.basal_calories_burned
        if wearable_tdee > 800:
            tdee = wearable_tdee
            data_source = "wearable"
        else:
            bmr  = compute_bmr(manual)
            tdee = bmr * ACTIVITY_MULTIPLIERS[manual.activity_level]
            data_source = "manual"
        # Combined if both sources contribute
        if wearable_tdee > 800 and manual.activity_level != "sedentary":
            data_source = "combined"
    else:
        bmr  = compute_bmr(manual)
        tdee = bmr * ACTIVITY_MULTIPLIERS[manual.activity_level]
        data_source = "manual"

    # Step 2 — Weekly goal → daily caloric adjustment
    # Use either the auto-computed weekly adjustment or the manual override
    # Manual override (surplus_deficit_kcal) takes precedence if non-zero
    if manual.surplus_deficit_kcal != 0:
        daily_adjustment = manual.surplus_deficit_kcal
    else:
        daily_adjustment = compute_weekly_adjustment(manual)

    adjusted_tdee = tdee + daily_adjustment

    # Step 3 — Meal target using NHANES fraction
    fraction    = NHANES_MEAL_FRACTIONS.get(manual.meal_time, 0.35)
    meal_target = adjusted_tdee * fraction

    # Step 4 — Recovery modifier
    recovery_score = 0.75  # default
    sleep_hours    = 7.0
    steps          = None

    if wearable:
        sleep_hours    = wearable.sleep_hours
        steps          = wearable.steps
        recovery_score = wearable.sleep_quality_score

    # Boost carbs if low recovery
    split = dict(MACRO_SPLITS[manual.goal])
    if recovery_score < 0.60:
        carb_boost = 0.10
        split["carbs"]   = min(split["carbs"] + carb_boost, 0.65)
        split["protein"] = max(split["protein"] - carb_boost / 2, 0.20)
        split["fat"]     = max(split["fat"]     - carb_boost / 2, 0.15)

    # Step 5 — Macro targets in grams
    protein_g = (meal_target * split["protein"]) / KCAL_PER_G["protein"]
    carbs_g   = (meal_target * split["carbs"])   / KCAL_PER_G["carbs"]
    fat_g     = (meal_target * split["fat"])      / KCAL_PER_G["fat"]

    # Step 6 — Build notes
    notes = []
    if data_source in ("wearable", "combined"):
        notes.append("TDEE sourced from wearable activity data")
    if daily_adjustment != 0:
        direction = "surplus" if daily_adjustment > 0 else "deficit"
        notes.append(
            f"Caloric {direction} of {abs(daily_adjustment)} kcal/day applied "
            f"({manual.weekly_goal_kg} kg/week target)"
        )
    notes.append(
        f"Meal target uses NHANES WWEIA 2021-2023 fraction "
        f"({int(fraction * 100)}% for {manual.meal_time})"
    )
    if recovery_score < 0.60:
        notes.append("Carbohydrate allocation increased +10% due to low recovery score")

    return HealthProfile(
        tdee_kcal            = round(tdee, 1),
        meal_target_kcal     = round(meal_target, 1),
        protein_target_g     = round(protein_g, 1),
        carbs_target_g       = round(carbs_g, 1),
        fat_target_g         = round(fat_g, 1),
        protein_pct          = round(split["protein"] * 100, 1),
        carbs_pct            = round(split["carbs"]   * 100, 1),
        fat_pct              = round(split["fat"]     * 100, 1),
        recovery_score       = round(recovery_score, 2),
        sleep_hours          = round(sleep_hours, 1),
        steps                = steps,
        meal_time            = manual.meal_time,
        goal                 = manual.goal,
        weekly_goal_kg       = manual.weekly_goal_kg,
        cuisine_preference   = manual.cuisine_preference,
        available_ingredients   = manual.available_ingredients,
        unavailable_ingredients = manual.unavailable_ingredients,
        data_source          = data_source,
        notes                = notes,
        nhanes_fraction_used = fraction,
    )