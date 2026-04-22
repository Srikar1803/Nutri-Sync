from fastapi import APIRouter, Query
from pydantic import BaseModel
from models import (
    ManualProfileInput, WearableData,
    QueryStringResponse, WearableResponse
)
from health_profile import build_health_profile
from wearable_mock import get_wearable_data
from query_builder import build_faiss_query

router = APIRouter(prefix="/health", tags=["health"])


class WearableSyncRequest(BaseModel):
    manual: ManualProfileInput
    wearable: WearableData


@router.post("/profile", response_model=QueryStringResponse)
def compute_profile(
    manual: ManualProfileInput,
    use_wearable: bool = Query(default=True, description="Include mock wearable data"),
    mock_seed: int = Query(default=42, description="Seed for reproducible mock data"),
):
    """
    Core Part 1 endpoint.

    Accepts manual user input, optionally fetches mock wearable data,
    computes TDEE + macro targets using NHANES-validated meal fractions,
    and returns the FAISS-ready query string + full health profile.
    """
    wearable = (
        get_wearable_data(use_mock=True, seed=mock_seed)
        if use_wearable else None
    )
    profile = build_health_profile(manual, wearable)
    query   = build_faiss_query(profile)

    return QueryStringResponse(
        query_string=query,
        health_profile=profile,
    )


@router.post("/wearable/sync", response_model=QueryStringResponse)
def sync_real_wearable(request: WearableSyncRequest):
    """
    Real wearable integration endpoint.
    Called after React frontend fetches Google Fit data.
    Accepts manual profile + real wearable data as separate fields.
    """
    profile = build_health_profile(request.manual, request.wearable)
    query   = build_faiss_query(profile)

    return QueryStringResponse(
        query_string=query,
        health_profile=profile,
    )


@router.get("/mock-wearable", response_model=WearableResponse)
def get_mock_wearable(
    seed: int = Query(default=42, description="Seed for reproducible data"),
):
    """Returns a standalone mock wearable snapshot for UI preview."""
    data = get_wearable_data(use_mock=True, seed=seed)
    return WearableResponse(data=data, is_mock=True, seed_used=seed)


@router.get("/ping")
def ping():
    return {"status": "ok", "service": "NutriSync Health API"}