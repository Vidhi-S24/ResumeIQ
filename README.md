ResumeIQ — AI-Powered Resume Screening Platform
ResumeIQ is an AI-driven resume screening tool built for HR teams. Upload a candidate's resume and a job description, and the system uses an LLM (via Groq) to extract structured candidate data, evaluate the match against the job requirements, and return a detailed, evidence-based verdict — qualified, partially qualified, or not qualified — along with a full score breakdown, strengths, gaps, and a recommendation.
All screening results are saved to MongoDB Atlas, scoped per logged-in HR user, with a dashboard, candidate history, and detailed per-candidate reports with charts.
---
Features
Resume parsing — extracts text from PDF and DOCX resumes and converts it into structured JSON (skills, experience, education, projects, certifications) using an LLM
AI-powered JD matching — compares the parsed resume against a job description and returns an honest, evidence-based verdict with a full score breakdown
Authentication — JWT-based login/signup, with sessions that persist across page refreshes
Per-user data isolation — every HR user only sees their own screened candidates, never another user's data
Dashboard — live stats (total screenings, average score, qualified count) and AI-generated insights based on real screening history
Candidates page — server-side paginated and searchable list of all past screenings
Candidate report page — detailed breakdown per candidate with radar and bar charts
MongoDB Atlas — cloud-hosted database, no local database server needed
---
Tech Stack
Frontend: React + TypeScript, Vite, React Router, Axios, Framer Motion, Recharts, Lucide Icons
Backend: Python, FastAPI (two separate services — see Architecture below), Motor (async MongoDB driver), PyMuPDF & python-docx (text extraction), Groq SDK (LLM inference), python-jose (JWT), passlib + bcrypt (password hashing)
Database: MongoDB Atlas (cloud)
AI Model: Groq-hosted `llama-3.3-70b-versatile`
---
Prerequisites
Before you begin, make sure you have:
Python 3.11+ installed
Node.js 18+ and npm installed
A MongoDB Atlas account (free tier is enough) — cloud.mongodb.com
A Groq API key (free tier available) — console.groq.com
Git installed
---
Setup Instructions
1. Clone the repository
2. Set up MongoDB Atlas
3. Get a Groq API key
Sign up at console.groq.com
Go to API Keys → Create API Key
Copy the key
4. Backend setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```
Create a `.env` file inside the `backend/` folder (copy from `.env.example`):
> **Never commit your `.env` file.** It's already excluded via `.gitignore`.
5. Run the backend (two servers, two terminals)
Terminal 1 — Core AI Engine:
```bash
cd backend
venv\Scripts\activate        # or source venv/bin/activate on macOS/Linux
uvicorn app.main:app --reload --port 8000
```
Terminal 2 — Database & Auth API:
```bash
cd backend
venv\Scripts\activate        # or source venv/bin/activate on macOS/Linux
uvicorn database_api.main:app --reload --port 8001
```
Verify both are running:
`http://localhost:8000/docs` → Core API (resume upload/parsing)
`http://localhost:8001/docs` → Database API (auth + screenings)
6. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
7. Create your first account
Since there's no pre-seeded admin user, use the Sign Up form on the login page to create your first HR account directly through the UI.
Environment Variables Reference
Variable	Description
`MONGODB_URL`	Your MongoDB Atlas connection string
`DATABASE_NAME`	Name of the database (e.g. `resumeiq_db`)
`JWT_SECRET_KEY`	Any long random string, used to sign JWT tokens
`JWT_ALGORITHM`	Algorithm for JWT signing (use `HS256`)
`ACCESS_TOKEN_EXPIRE_MINUTES`	How long a login session lasts (default: 480 = 8 hours)
`GROQ_API_KEY`	Your API key from console.groq.com
---
API Overview
Endpoint	Method	Port	Description
`/upload-resume`	POST	8000	Upload a PDF/DOCX resume, returns parsed JSON
`/auth/login`	POST	8001	Login, returns JWT token
`/auth/signup`	POST	8001	Create a new HR account
`/auth/me`	GET	8001	Get current logged-in user
`/screenings/analyze`	POST	8001	Match resume against JD, save result
`/screenings`	GET	8001	List your past screenings (paginated, searchable)
`/screenings/{id}`	GET	8001	View one screening in detail
`/screenings/{id}`	DELETE	8001	Delete a screening
`/screenings/stats/overview`	GET	8001	Dashboard summary stats
`/screenings/stats/insights`	GET	8001	AI-generated insight sentences
`/screenings/stats/recent`	GET	8001	Most recent screenings
Full interactive API documentation is available at `/docs` on each running service.
---
Notes
This project uses Groq's free tier, which has rate limits (requests/minute and tokens/minute). If you see a `503` or rate-limit error, wait a moment and try again.
---
License
This project is for educational/personal use.
