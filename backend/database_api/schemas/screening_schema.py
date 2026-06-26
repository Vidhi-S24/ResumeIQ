from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class JobDescriptionEmbed(BaseModel):
    job_title: Optional[str] = None
    raw_text: str
    required_skills: list[str] = []
    preferred_skills: list[str] = []
    required_experience: Optional[str] = None
    education_requirements: list[str] = []
    responsibilities: list[str] = []


class DimensionScores(BaseModel):
    skills: int
    experience: int
    education: int
    domain_relevance: int


class ScoreBreakdown(BaseModel):
    skills_calculation: str
    experience_calculation: str
    education_calculation: str
    domain_calculation: str


class AnalyzeResumeRequest(BaseModel):
    jd_text: str
    parsed_resume: dict
    job_title: Optional[str] = None


class ScreeningResponse(BaseModel):
    id: str
    candidate_name: str
    job_description: JobDescriptionEmbed
    verdict: str
    overall_score: int
    dimension_scores: DimensionScores
    score_breakdown: ScoreBreakdown
    matched_skills: list[str]
    missing_skills: list[str]
    strengths: list[str]
    gaps: list[str]
    ai_review: str
    ai_recommendation: str
    screened_by: str
    created_at: datetime