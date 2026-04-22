from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.health import router as health_router

app = FastAPI(
    title="NutriSync API",
    description="Biometric-aware personalized recipe recommendation system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # CRA fallback
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)


@app.get("/")
def root():
    return {
        "name": "NutriSync API",
        "version": "1.0.0",
        "docs": "/docs",
    }
