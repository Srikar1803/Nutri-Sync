from pydantic import BaseModel, Field
from typing import Optional, Literal, List


class ManualProfileInput(BaseModel):
    age: int = Field(..., ge=10, le=100)
    weight_kg: float = Field(..., ge=30, le=300)
    height_cm: float = Field(..., ge=100, le=250)
    sex: Literal["male", "female"]
    activity_level: Literal["sedentary", "light", "moderate", "active", "very_active"]
    goal: Literal["weight_loss", "maintenance", "muscle_gain"]
    weekly_goal_kg: float = Field(default=0.5, ge=0.0, le=2.0)
    cuisine_preference: str = "Any"
    available_ingredients: List[str] = []
    unavailable_ingredients: List[str] = []
    meal_time: Literal["breakfast", "lunch", "dinner", "snack"] = "dinner"
    surplus_deficit_kcal: int = Field(default=0, ge=-2000, le=2000)


class WearableData(BaseModel):
    active_calories_burned: float = Field(..., ge=0)
    basal_calories_burned: float = Field(..., ge=0)
    steps: int = Field(..., ge=0)
    sleep_hours: float = Field(..., ge=0, le=24)
    sleep_quality_score: float = Field(..., ge=0.0, le=1.0)
    hrv_ms: Optional[float] = Field(default=None, ge=0)


class HealthProfile(BaseModel):
    # Caloric targets
    tdee_kcal: float
    meal_target_kcal: float
    # Macro targets in grams
    protein_target_g: float
    carbs_target_g: float
    fat_target_g: float
    # Macro percentages (for UI display)
    protein_pct: float
    carbs_pct: float
    fat_pct: float
    # Wearable context
    recovery_score: float
    sleep_hours: float
    steps: Optional[int] = None
    # Request context
    meal_time: str
    goal: str
    weekly_goal_kg: float = 0.5
    cuisine_preference: str
    available_ingredients: List[str]
    unavailable_ingredients: List[str] = []
    data_source: Literal["manual", "wearable", "combined"]
    notes: List[str] = []
    # NHANES reference fractions used
    nhanes_fraction_used: float


class QueryStringResponse(BaseModel):
    query_string: str
    health_profile: HealthProfile


class WearableResponse(BaseModel):
    data: WearableData
    is_mock: bool
    seed_used: Optional[int] = None