from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Core API
from app.routes.resume_screening_routes import (
    router as resume_screening_router,
)
from app.services.groq_client_service import check_groq_connection

# Database API
from database_api.database.mongodb import client
from database_api.routes.auth_routes import router as auth_router
from database_api.routes.screening_routes import router as screening_router
from database_api.routes.assistant_routes import router as assistant_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once when the application starts
    and once when it shuts down.
    """

    # MongoDB Connection
    try:
        await client.admin.command("ping")
        print("✅ MongoDB Atlas Connected Successfully")
    except Exception as e:
        print("❌ MongoDB Connection Failed")
        print(e)

    # Groq Connection
    try:
        check_groq_connection()
        print("✅ Groq Connected Successfully")
    except Exception as e:
        print("❌ Groq Connection Failed")
        print(e)

    yield

    # Shutdown
    client.close()
    print("ResumeIQ API Shutdown Complete")


app = FastAPI(
    title="ResumeIQ API",
    description="""
AI-powered Resume Screening Platform

Features:
- Resume Upload & Parsing
- AI Resume Screening
- Bulk Resume Screening
- Authentication
- Dashboard Statistics
- Candidate Reports
- AI Recruitment Assistant (RAG)
""",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local Development
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # Add your Vercel URL after deployment
        # "https://resumeiq.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(resume_screening_router)
app.include_router(auth_router)
app.include_router(screening_router)
app.include_router(assistant_router)

@app.get("/", tags=["Home"])
def home():
    return {
        "name": "ResumeIQ API",
        "version": "1.0.0",
        "status": "running",
        "documentation": "/docs",
        "redoc": "/redoc",
    }