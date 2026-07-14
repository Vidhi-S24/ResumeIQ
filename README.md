# ResumeIQ — AI-Powered Resume Screening Platform

ResumeIQ is an AI-driven resume screening platform built for HR teams and recruiters. Upload a candidate's resume and a job description, and the system uses an LLM (via Groq) to extract structured candidate information, evaluate the candidate against the job requirements, and generate an evidence-based screening report with detailed scores, strengths, gaps, and hiring recommendations.

All screening results are securely stored in MongoDB Atlas and are isolated per authenticated recruiter using JWT authentication. Recruiters can view dashboards, candidate history, detailed reports, and interact with an AI Recruitment Assistant powered by Retrieval-Augmented Generation (RAG).

---

# Features

### Resume Parsing
- Extracts text from PDF and DOCX resumes
- Converts resumes into structured JSON using an LLM
- Extracts:
  - Skills
  - Experience
  - Education
  - Projects
  - Certifications

### AI-Powered Resume Screening
- Matches resumes against job descriptions
- Generates evidence-based hiring decisions
- Overall score calculation
- Strengths & gaps analysis
- AI-generated recommendations

### Bulk Resume Screening
- Upload multiple resumes simultaneously
- Individual AI screening for each resume
- Ranked results
- Reports failed/unprocessed resumes

### Authentication
- JWT Login & Signup
- Persistent sessions
- Protected routes

### Dashboard
- Total screenings
- Qualified candidates
- Average screening score
- Recent screenings
- AI-generated recruitment insights

### Candidate Management
- Searchable candidate history
- Server-side pagination
- Candidate reports with charts
- Delete screenings

### AI Recruitment Assistant (RAG)
- Natural language chat interface
- Retrieval-Augmented Generation (RAG)
- Semantic vector search using embeddings
- Answers questions using previously screened candidates
- User-specific retrieval (each recruiter only accesses their own data)
- Candidate comparison
- Skill-based search
- Hiring insights
- Resume-based Q&A

### Database
- MongoDB Atlas
- Vector Search
- Secure recruiter-specific data isolation

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- Framer Motion
- Recharts
- Lucide React

## Backend

- Python
- FastAPI
- Motor (Async MongoDB Driver)
- PyMuPDF
- python-docx
- Groq SDK
- python-jose (JWT)
- Passlib + bcrypt

## AI

- Groq
- llama-3.3-70b-versatile
- Google Gemini Embedding API
- Retrieval-Augmented Generation (RAG)

## Database

- MongoDB Atlas
- MongoDB Atlas Vector Search

---

# Architecture

```
                               React + Vite
                      │
                      ▼
              FastAPI Backend
        ┌─────────────────────────┐
        │ Authentication (JWT)    │
        │ Resume Parsing          │
        │ Resume Screening        │
        │ Dashboard APIs          │
        │ AI Assistant (RAG)      │
        └─────────────────────────┘
             │             │
             ▼             ▼
      MongoDB Atlas     Groq LLM
             │             │
             ▼             │
   Vector Search      Gemini Embeddings
```

---

# Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- MongoDB Atlas account
- Groq API Key
- Git

---

# Setup

## 1. Clone Repository

```bash
git clone <repository-url>
cd ResumeIQ
```

---

## 2. Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` inside `backend/`

```env
MONGODB_URL=
DATABASE_NAME=
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
GROQ_API_KEY=
```

Run backend

```bash
uvicorn app.main:app --reload
```

Backend

```
http://localhost:8000
```

Swagger Docs

```
http://localhost:8000/docs
```

---

## 3. Frontend Setup

```bash
cd frontend

npm install
```

Create `.env`

```env
VITE_API_URL=http://localhost:8000
```

Run

```bash
npm run dev
```

Frontend

```
http://localhost:5173
```

---

## 4. Create an Account

Use the Sign Up page to create your first recruiter account.

---

# Environment Variables

## Backend

| Variable                    | Description                     |
| --------------------------- | ------------------------------- |
| MONGODB_URL                 | MongoDB Atlas connection string |
| DATABASE_NAME               | Database name                   |
| JWT_SECRET_KEY              | JWT secret                      |
| JWT_ALGORITHM               | HS256                           |
| ACCESS_TOKEN_EXPIRE_MINUTES | Session expiry                  |
| GROQ_API_KEY                | Groq API Key                    |
| GEMINI_API_KEY              | Google Gemini API Key           |


## Frontend

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API URL |

---

# API Overview

## Resume

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload-resume` | POST | Upload & parse resume |
| `/analyze-resume` | POST | Analyze parsed resume against JD |
| `/upload-resumes-bulk` | POST | Upload multiple resumes |

---

## Authentication

| Endpoint | Method |
|----------|--------|
| `/auth/register` | POST |
| `/auth/login` | POST |
| `/auth/me` | GET |

---

## Screenings

| Endpoint | Method |
|----------|--------|
| `/screenings/analyze` | POST |
| `/screenings/analyze-bulk` | POST |
| `/screenings` | GET |
| `/screenings/{id}` | GET |
| `/screenings/{id}` | DELETE |
| `/screenings/stats/overview` | GET |
| `/screenings/stats/insights` | GET |
| `/screenings/stats/recent` | GET |

---

## AI Assistant

| Endpoint | Method |
|----------|--------|
| `/assistant/ask` | POST |
| `/assistant/search` | POST |

---

Interactive API Documentation

```
http://localhost:8000/docs
```

---

# Notes

- Uses Groq for resume parsing, screening, and AI-powered recommendations.
- Uses Google's Gemini Embedding API to generate semantic embeddings for Retrieval-Augmented Generation (RAG).
- MongoDB Atlas is used as both the primary database and vector search engine.
- The AI Recruitment Assistant retrieves only candidates belonging to the authenticated recruiter using semantic vector search.
- The AI Recruitment Assistant uses Retrieval-Augmented Generation (RAG) to answer recruiter questions using only the authenticated user's screened candidates.

---

# License

This project is intended for educational and portfolio purposes.
