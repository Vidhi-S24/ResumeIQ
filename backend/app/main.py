from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.resume_screening_routes import router as resume_screening_routes
from app.services.groq_client_service import check_groq_connection

app = FastAPI(title="ResumeIQ Core API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    check_groq_connection()  

app.include_router(resume_screening_routes)

@app.get("/")
def home():
    return {"message": "Resume Analyzer API Running"}

