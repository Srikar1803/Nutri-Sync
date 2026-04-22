"""
query_builder.py
----------------
Converts a HealthProfile into a natural language query string
optimised for BGE-M3 dense retrieval against the RecipeNLG FAISS index.
"""

from models import HealthProfile


def build_faiss_query(profile: HealthProfile) -> str:

    meal_phrase_map = {
        "breakfast": "morning breakfast",
        "lunch":     "midday lunch",
        "dinner":    "evening dinner",
        "snack":     "light snack",
    }
    meal_phrase = meal_phrase_map.get(profile.meal_time, profile.meal_time)

    cuisine = profile.cuisine_preference.strip()
    cuisine_phrase = (
        f"{cuisine} " if cuisine.lower() not in ("any", "none", "") else ""
    )

    # Available ingredients clause (top 6)
    if profile.available_ingredients:
        ings = ", ".join(profile.available_ingredients[:6])
        ing_clause = f" using {ings}"
    else:
        ing_clause = ""

    # Unavailable ingredients clause
    if profile.unavailable_ingredients:
        no_ings = ", ".join(profile.unavailable_ingredients[:6])
        no_ing_clause = f" without {no_ings}"
    else:
        no_ing_clause = ""

    goal_phrase_map = {
        "weight_loss":  "low-calorie high-protein",
        "muscle_gain":  "high-protein muscle-building",
        "maintenance":  "balanced nutritious",
    }
    goal_phrase = goal_phrase_map.get(profile.goal, "healthy")

    # Recovery clause
    if profile.recovery_score < 0.60:
        recovery_clause = " with complex carbohydrates for energy recovery"
    elif profile.recovery_score > 0.85 and profile.goal == "muscle_gain":
        recovery_clause = " with extra lean protein for muscle synthesis"
    else:
        recovery_clause = ""

    # Activity level from wearable steps
    steps = getattr(profile, 'steps', None)
    if steps is not None:
        if steps >= 10000:
            activity_clause = " for a highly active person"
        elif steps >= 7000:
            activity_clause = " for an active person"
        elif steps >= 4000:
            activity_clause = " for a moderately active person"
        else:
            activity_clause = " for a lightly active person"
    else:
        activity_clause = ""

    macro_clause = (
        f"targeting {profile.meal_target_kcal:.0f} kcal, "
        f"{profile.protein_target_g:.0f}g protein, "
        f"{profile.carbs_target_g:.0f}g carbs, "
        f"{profile.fat_target_g:.0f}g fat"
    )

    query = (
        f"{goal_phrase} {cuisine_phrase}{meal_phrase} recipe"
        f"{ing_clause}{no_ing_clause}{recovery_clause}{activity_clause}, {macro_clause}"
    )

    return query.strip()