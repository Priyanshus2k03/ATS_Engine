# 🚀 Muuchstac ATS Engine (v1.1)

An AI-powered, high-throughput Batch Resume Screening and Candidate Evaluation System built with **FastAPI**, **Google Gemini AI**, and a modern **Vanilla JavaScript & CSS** single-page web interface.

---

## 🌟 Key Features

- **⚡ Batch Resume Screening**: Upload multiple candidate resumes (`.pdf` and `.docx`) simultaneously and analyze them in parallel using `asyncio.gather`.
- **🎯 AI JD Requirement Extraction**: Automatically reads job descriptions and extracts minimum/maximum experience, required skills, degree qualifications, and target office locations.
- **🛡️ Mandatory Hard Filters**:
  - **Experience Range**: Disqualifies candidates whose experience falls outside the target years range.
  - **Core Skills**: Enforces mandatory technical skills filtering.
  - **Education**: Enforces mandatory minimum degree requirements.
  - **Location & Commute Relevancy**: Hybrid location engine (using Nominatim geocoding & distance calculation) to score commute distance and flag relocation/out-of-state candidates.
- **💯 Zero-Drop Resume Guarantee**: 100% of uploaded resume files are accounted for in the breakdown table. Unreadable scanned PDFs or corrupted files are gracefully flagged with explicit rejection reasons rather than dropped.
- **🔄 Candidate Deduplication**: Smart deduplication detects identical candidate submissions across batches and retains the highest-scoring profile.
- **📚 Local Job Description Library**: Save, load, and manage frequently used Job Descriptions directly in browser `localStorage`.
- **🌙 Dark / Light Theme**: Built-in modern theme switch with persistent preference saving.
- **📊 Detailed Dashboard & Pillar Breakdown**: Visual candidate modal showing total score (out of 100), experience breakdown (40 pts), skills match (30 pts), education score (30 pts), extracted email/phone, matched skills, and missing requirements.

---

## 📁 Directory Structure

```text
ATS_Engine/
├── backend/
│   ├── api.py                 # Core FastAPI application & REST endpoints
│   └── requirements.txt       # Python dependencies specification
├── frontend/
│   ├── index.html             # Web application single-page interface
│   ├── css/
│   │   └── style.css          # Responsive stylesheet with dark/light themes
│   └── js/
│       └── script.js          # Client-side UI logic, API bindings & state management
├── .env                       # Environment variables (GEMINI_API_KEY)
├── .gitignore                 # Security & version control exclusion rules
├── vercel.json                # Production deployment header configuration
└── README.md                  # System documentation
```

---

## 🛠️ Technology Stack

- **Backend**:
  - [FastAPI](https://fastapi.tiangolo.com/) — High-performance async Python web framework
  - [Uvicorn](https://www.uvicorn.org/) — Lightning-fast ASGI server implementation
  - [Google GenAI SDK](https://github.com/google/generative-ai-python) — Gemini structured content generation
  - [Pydantic v2](https://docs.pydantic.dev/) — Strict data validation & schema enforcement
  - [PyPDF](https://pypdf.readthedocs.io/) & [python-docx](https://python-docx.readthedocs.io/) — Document text extraction
  - [GeoPy](https://geopy.readthedocs.io/) & [scikit-learn](https://scikit-learn.org/) — Nominatim geocoding & spatial haversine distance calculation
- **Frontend**:
  - HTML5, Vanilla CSS3 (Custom Properties & Flexbox/Grid Layout)
  - ES6 JavaScript (Fetch API, Async/Await, Debounced Event Handlers, LocalStorage)

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.10 or higher
- A Google Gemini API Key

### 2. Clone Repository
```bash
git clone https://github.com/singhp2k03/ATS_.git
cd ATS_
```

### 3. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

---

## 🚀 Running the Application

Start the FastAPI backend server:

```bash
python -m uvicorn backend.api:app --host 127.0.0.1 --port 8000
```

Open your browser and navigate to:
👉 **`http://127.0.0.1:8000`**

---

## 📡 REST API Reference

### 1. Extract Job Description Parameters
Extracts structured parameters from raw job text.

- **Endpoint**: `POST /extract-jd-params/`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `job_description` (str): Raw text of the job description.
  - `ai_provider` (str, default: `"gemini"`): AI provider identifier.

### 2. Analyze Resume Batch
Evaluates a batch of resume files against job description and hard filters.

- **Endpoint**: `POST /analyze-batch-parallel/`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `files` (List[UploadFile]): List of PDF/DOCX resume files.
  - `job_description` (str): Job Description text.
  - `min_experience_years` (float): Minimum experience threshold.
  - `max_experience_years` (float): Maximum experience threshold.
  - `mandatory_experience` (bool): Require experience within range.
  - `required_skills` (str): Comma-separated list of skills.
  - `mandatory_skills` (bool): Require skills match.
  - `required_education` (str): Degree requirements.
  - `mandatory_education` (bool): Require degree match.
  - `target_location` (str): Office city location (e.g., `"Borivali, Mumbai"`).
  - `mandatory_location` (bool): Require local commute/state match.
  - `passing_score` (int, default: `75`): Qualification score cutoff.

---

## 📝 License

This project is licensed under the MIT License.
