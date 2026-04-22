# NutriSync — Biometric-Driven Recipe Generation with LLM + USDA Validation

> **M.S. Applied Data Science Capstone · University of Florida · Spring 2026**  
> Srikar Gowrishetty · Advisor: Dr. Catia S. Silva

NutriSync is a three-part agentic AI pipeline that reads real-time wearable
biometric data from Google Health Connect, computes a personalised caloric
target, retrieves semantically relevant recipes from a 1.8M-recipe FAISS
index, generates a customised recipe using Groq Llama 3.1 8B, and
independently validates every macro-nutrient claim against USDA FoodData
Central before showing the result to the user.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Quick Start — Backend](#quick-start--backend)
4. [Quick Start — Frontend](#quick-start--frontend)
5. [Environment Variables](#environment-variables)
6. [Large Files (FAISS Index + Database)](#large-files-faiss-index--database)
7. [Running Tests](#running-tests)
8. [Running Evaluation (Module 10)](#running-evaluation-module-10)
9. [System Architecture](#system-architecture)
10. [API Reference](#api-reference)
11. [Key Results](#key-results)
12. [Troubleshooting](#troubleshooting)

---

## Project Structure

```
NutriSync/
├── backend/
│   ├── main.py                          # FastAPI app entry point
│   ├── requirements.txt                 # All pinned Python dependencies
│   ├── .env.example                     # Environment variable template
│   ├── module1_user_profile.py      # User profile + goal API
|   ├── module2_wearable.py          # Google Health Connect OAuth2
│   ├── module3_eda.py               # Biometric EDA utilities
│   ├── module4_biometric.py         # TDEE + nutrient flags
│   ├── module5_usda.py              # USDA DB + fuzzy matcher
│   ├── module6_prompt.py            # RAG prompt builder (8-section)
│   ├── module7_llm.py               # Groq LLM caller + retry
│   ├── module8_parser.py            # Recipe parser + correction loop
│   └── module10_evaluation.py       # Evaluation engine (MAE, t-test)
│   └── data/
│       ├── usda_nutrition_processed.csv # 5,005 ingredients (tracked in Git)
│       ├── recipe_index.faiss           # NOT in Git — download separately
│       └── recipes.db                   # NOT in Git — download separately
│   
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ProfileForm.jsx          # Health profile + goal form
│   │   │   ├── WearableCard.jsx         # Wearable snapshot panel
│   │   │   ├── MacroDisplay.jsx         # FAISS query + nutrition targets
│   │   │   └── RecipeCard.jsx           # Generated recipe + macro validation
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   └── services/
│   │       └── api.js
│   ├── package.json
│   └── index.html
└── README.md
```

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | **3.11+** | 3.12 has FlagEmbedding conflicts — use 3.11 |
| Node.js | **18+** | Required for the React frontend |
| npm | 9+ | Comes with Node.js |
| Groq API key | — | Free at [console.groq.com](https://console.groq.com) |

---

## Quick Start — Backend

```bash
# 1. Clone the repo
git clone https://github.com/Srikar1803/NutriSync
cd NutriSync/backend

# 2. Create and activate a virtual environment
python -m venv venv

# macOS / Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 3. Install all dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Open .env and add your GROQ_API_KEY (see section below)

# 5. Download the large files and place them in backend/data/
#    (see "Large Files" section below)

# 6. Start the backend
uvicorn main:app --reload --port 8000
```

API live at `http://localhost:8000` · Interactive docs at `http://localhost:8000/docs`

---

## Quick Start — Frontend

Open a **second terminal** (keep the backend running):

```bash
cd NutriSync/frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Get free at [console.groq.com](https://console.groq.com) → API Keys |
| `USDA_CSV_PATH` | Optional | Default: `data/usda_nutrition_processed.csv` |
| `FAISS_INDEX_PATH` | Optional | Default: `data/recipe_index.faiss` |
| `RECIPE_DB_PATH` | Optional | Default: `data/recipes.db` |
| `GOOGLE_CLIENT_ID` | Optional | For live Google Health Connect OAuth2 |
| `GOOGLE_CLIENT_SECRET` | Optional | Leave blank to use mock wearable mode |
| `BATCH_DELAY` | Optional | Seconds between Groq calls in batch eval (default: `2.0`) |

**Getting a free Groq API key:**
1. Go to [console.groq.com](https://console.groq.com) and sign up
2. Click **API Keys → Create API Key**
3. Paste the key into `.env` as `GROQ_API_KEY=gsk_...`

---

## Large Files (FAISS Index + Database)

The FAISS index and recipe database are too large for Git.

**Download from Google Drive:**
> 🔗 **[NutriSync Data Files — Google Drive](https://drive.google.com/drive/folders/1AGIia7WFkTOBZUqvFPDcuO5I0Bzgn1rh?usp=sharing)**  
> *(replace this link with your actual public share link)*

Files to download and where to place them:

```
backend/data/
├── recipe_index.faiss    ← ~2.3 GB (PQ-compressed) or ~7 GB (float32)
└── recipes.db            ← ~400 MB SQLite recipe metadata
```

**To rebuild the index from scratch** (needs Colab T4 GPU, ~4.5 hrs):
Open `notebooks/02_usda_eda.ipynb` in Google Colab and run the
"FAISS Index Build" section.

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

All 146 tests should pass.

```bash
pytest tests/test_module4.py -v   # Biometric Interpreter — 40 tests
pytest tests/test_module5.py -v   # USDA Database — 33 tests
pytest tests/test_module6.py -v   # Prompt Builder — 73 tests
pytest tests/test_module8.py -v   # Recipe Parser
```

---

## Running Evaluation (Module 10)

```bash
cd evaluation
python module10_validation.py
```

Runs the full evaluation against 200 Nutrition5k dishes and saves results
to `validation_report.json`.

**Expected results:**

| Metric | Baseline | NutriSync | Improvement |
|--------|----------|-----------|-------------|
| Caloric MAE (kcal) | 195.0 | 47.3 | 85.7% |
| Fat MAE (g) | 9.45 | 0.001 | 99.9% |
| Carbs MAE (g) | 19.79 | 0.296 | 98.5% |
| Protein MAE (g) | 12.44 | 0.164 | 98.7% |
| t-statistic | — | 15.82 | p < 0.0001 |

---

## System Architecture

```
User (React frontend)
    │
    ▼  profile + ingredients + goal (kg/week)
FastAPI Backend
    ├── Module 2:  Google Health Connect → live biometrics
    ├── Module 4:  TDEE + meal target + nutrient flags
    └── Module 6:  RAG prompt builder
         │
         ▼  "dinner Mediterranean recipe for weight loss
             targeting -0.5 kg/week with chicken, broccoli..."
    FAISS IndexFlatIP  (1.8M bge-m3 1024-dim vectors)
         │
         ▼  Top-10 candidate recipe texts  (SQLite lookup)
    Groq Llama 3.1 8B  (~500 tok/sec)
         │
         ▼  Generated recipe JSON
    USDA Validation + Proportional Correction Loop  (≤10 iter)
         │
         ▼  Validated recipe + macro comparison table
    React UI — RecipeCard with per-macro deviation badges
```

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/profile` | POST | Compute TDEE, meal targets, nutrient flags |
| `/profile/wearable` | POST | Sync Google Health Connect biometrics |
| `/recipe/generate` | POST | Full pipeline: FAISS → LLM → USDA validate |
| `/usda/search` | GET | Search USDA ingredient database |
| `/health` | GET | Health check |

Full interactive docs: `http://localhost:8000/docs`

---

## Key Results

Evaluated on 200 randomly sampled dishes from Google Nutrition5k
(lab-verified ground truth, Google Research):

- **85.7% reduction** in caloric MAE vs. rule-based baseline  
- **100% USDA grounding** — every ingredient independently verified  
- Paired t-test: **t(199) = 15.82, p < 0.0001**  
- 91.5% of recipes passed validation without any correction iteration

---

## Troubleshooting

**`ImportError: cannot import name 'is_flax_available'`**  
FlagEmbedding conflicts with newer transformers. Use only `sentence-transformers==3.3.1` (already in requirements.txt). Do not separately install FlagEmbedding.

**FAISS runs out of memory**  
The full float32 index needs ~7 GB RAM. Use the PQ-compressed version (~2.3 GB) or run on Google Colab Pro.

**`ModuleNotFoundError: No module named 'groq'`**  
Make sure your virtual environment is activated before running pip install:  
Windows: `venv\Scripts\activate` · Mac/Linux: `source venv/bin/activate`

**Groq 429 Rate Limit during evaluation**  
The evaluation script uses exponential backoff. Set `BATCH_DELAY=2.5` in `.env` to slow it down further.

**Google Health Connect not connecting**  
Leave `GOOGLE_CLIENT_ID` blank in `.env` to use mock wearable mode. The UI shows a "Compute with mock wearable" button automatically.

**Tailwind CSS styles not loading**  
This project uses Tailwind v4 (CSS-native config). Run `npm install` fresh inside `frontend/`. Do not create a `tailwind.config.js` — v4 uses `@source` and `@theme` directives in CSS.

---

## License

MIT — see `LICENSE` file.
