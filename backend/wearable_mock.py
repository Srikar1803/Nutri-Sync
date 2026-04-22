"""
wearable_mock.py
----------------
Simulates realistic HealthKit / Google Health Connect data.

In production this module is replaced by a native SDK bridge:
  iOS:     Swift HealthKit → React Native module → FastAPI
  Android: Kotlin Health Connect → React Native module → FastAPI

The mock produces statistically realistic values based on
CDC/NIH population averages for each metric.
"""

import random
from models import WearableData


def generate_mock_wearable(seed: int | None = None) -> WearableData:
    """
    Generates one day of realistic wearable data.

    Ranges are based on:
    - Steps:   CDC reports average American adult takes 3,000–4,000 steps/day,
               active users typically 7,000–10,000.
    - Calories: NIH average BMR 1,400–1,900 kcal; active burn 300–800 kcal.
    - Sleep:   NSF recommends 7–9 hours; average adult gets 6.8 hours.
    - HRV:     Normal range 20–80 ms; higher = better recovery.
    """
    rng = random.Random(seed)

    steps = rng.randint(3500, 13000)

    # Active calories correlate with steps (~0.04 kcal/step + base activity)
    active_kcal = round(steps * 0.04 + rng.uniform(-40, 60), 1)
    active_kcal = max(150, active_kcal)

    basal_kcal = round(rng.uniform(1380, 1850), 1)

    sleep_hours = round(rng.uniform(5.0, 9.2), 1)

    # Sleep quality correlates loosely with duration
    if sleep_hours < 6:
        sleep_quality = round(rng.uniform(0.35, 0.58), 2)
    elif sleep_hours >= 8:
        sleep_quality = round(rng.uniform(0.72, 0.96), 2)
    else:
        sleep_quality = round(rng.uniform(0.52, 0.88), 2)

    hrv = round(rng.uniform(18, 82), 1)

    return WearableData(
        active_calories_burned=active_kcal,
        basal_calories_burned=basal_kcal,
        steps=steps,
        sleep_hours=sleep_hours,
        sleep_quality_score=sleep_quality,
        hrv_ms=hrv,
    )


def get_wearable_data(use_mock: bool = True, seed: int | None = None) -> WearableData:
    """
    Entry point for wearable data acquisition.

    Args:
        use_mock:  True  → simulated data (demo/testing)
                   False → real SDK call (not yet implemented)
        seed:      Optional random seed for reproducible mock data

    In the real integration:
      1. React Native calls a native module (Swift/Kotlin)
      2. Native module queries HealthKit/Health Connect for today
         midnight → now (or yesterday for breakfast requests)
      3. Returns JSON matching WearableData schema
      4. FastAPI endpoint receives it as request body
    """
    if use_mock:
        return generate_mock_wearable(seed=seed)

    # ── Real integration placeholder ──────────────────────────────────────
    # This will be replaced with actual SDK bridge call.
    # The React Native side sends a POST to /health/wearable/sync
    # with the native HealthKit/Health Connect payload.
    raise NotImplementedError(
        "Real wearable integration not yet implemented. "
        "Pass use_mock=True for demo mode or POST to /health/wearable/sync "
        "from the React Native native module."
    )
