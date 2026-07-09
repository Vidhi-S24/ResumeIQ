from fastapi import APIRouter, HTTPException, Depends, Query
from database_api.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from bson.errors import InvalidId
import asyncio

from database_api.schemas.screening_schema import AnalyzeResumeRequest, BulkAnalyzeRequest
from database_api.services.screening_service import build_and_save_screening, _serialize_screening
from database_api.repositories.screening_repository import (
    get_screenings, count_screenings, get_screening_by_id, delete_screening,
    get_stats_overview, get_top_missing_skills, get_top_required_skills, get_recent_screenings,
)
from database_api.dependencies.auth_dependency import get_current_user
from app.services.groq_client_service import match_resume_with_jd

router = APIRouter(prefix="/screenings", tags=["Screenings"])

@router.post("/analyze")
async def analyze_and_save(
    payload: AnalyzeResumeRequest,
    current_user=Depends(get_current_user)
):
    """Runs the AI match, then saves only the review to MongoDB."""
    try:
        loop = asyncio.get_event_loop()
        match_result = await loop.run_in_executor(
            None, match_resume_with_jd, payload.parsed_resume, payload.jd_text
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")

    if "error" in match_result:
        raise HTTPException(status_code=500, detail=f"Model error: {match_result['error']}")

    saved = await build_and_save_screening(
        jd_text=payload.jd_text,
        parsed_resume=payload.parsed_resume,
        match_result=match_result,
        screened_by=str(current_user["_id"]),
        job_title=payload.job_title
    )
    return saved

@router.get("")
async def list_screenings(
    page: int = Query(1, ge=1),
    limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    verdict: str = Query(None),
    search: str = Query(None),   
    sortBy: str = Query("created_at"),
    current_user=Depends(get_current_user)
):
    """List ONLY the screenings created by the logged-in user."""
    screened_by = str(current_user["_id"])
    skip = (page - 1) * limit

    docs = await get_screenings(
        screened_by=screened_by, skip=skip, limit=limit, verdict=verdict, search=search, sort_by=sortBy,  
    )
    total = await count_screenings(screened_by=screened_by, verdict=verdict, search=search)  

    return {
        "screenings": [_serialize_screening(doc) for doc in docs],
        "total": total,
        "page": page
    }

@router.get("/stats/overview")
async def stats_overview(current_user=Depends(get_current_user)):
    """Dashboard summary numbers — scoped to the logged-in user only."""
    screened_by = str(current_user["_id"])
    return await get_stats_overview(screened_by=screened_by)


@router.get("/stats/insights")
async def stats_insights(current_user=Depends(get_current_user)):
    """AI Insights — scoped to the logged-in user only."""
    screened_by = str(current_user["_id"])
    missing = await get_top_missing_skills(screened_by=screened_by, limit=3)
    required = await get_top_required_skills(screened_by=screened_by, limit=1)

    insights = []

    if required:
        top_skill = required[0]["_id"]
        insights.append(f"{top_skill} is the most requested skill in your screened job descriptions.")

    if missing:
        top_missing = missing[0]["_id"]
        insights.append(f"\"{top_missing}\" is the most common missing skill among your screened candidates.")

    if len(missing) > 1:
        second_missing = missing[1]["_id"]
        insights.append(f"\"{second_missing}\" also appears frequently as a skill gap.")

    if not insights:
        insights.append("Run a few screenings to start seeing AI-generated insights here.")

    return {"insights": insights}


@router.get("/stats/recent")
async def recent_screenings(current_user=Depends(get_current_user)):
    """Most recent screenings for the dashboard feed — scoped to the logged-in user."""
    screened_by = str(current_user["_id"])
    docs = await get_recent_screenings(screened_by=screened_by, limit=5)
    return {"screenings": [_serialize_screening(doc) for doc in docs]}

@router.post("/analyze-bulk")
async def analyze_bulk(
    payload: BulkAnalyzeRequest,
    current_user=Depends(get_current_user)
):
    """Match multiple resumes against ONE job description, save all results,
    and return them ranked by overall_score — highest first."""

    if len(payload.parsed_resumes) == 0:
        raise HTTPException(status_code=422, detail="No resumes provided.")

    screened_by = str(current_user["_id"])

    results = await asyncio.gather(*[
        _match_and_save_one(resume, payload.jd_text, payload.job_title, screened_by)
        for resume in payload.parsed_resumes
    ])

    successful = [r for r in results if r["status"] == "success"]
    failed = [r for r in results if r["status"] == "failed"]

    return {
        "total_submitted": len(payload.parsed_resumes),
        "success_count": len(successful),
        "failed_count": len(failed),
        "screened_candidates": successful,
        "unscreened_candidates": failed,
    }

@router.get("/{screening_id}")
async def get_one_screening(screening_id: str, current_user=Depends(get_current_user)):
    screened_by = str(current_user["_id"])
    try:
        doc = await get_screening_by_id(screening_id, screened_by=screened_by)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid screening id.")

    if not doc:
        raise HTTPException(status_code=404, detail="Screening not found.")

    return _serialize_screening(doc)

@router.delete("/{screening_id}")
async def remove_screening(screening_id: str, current_user=Depends(get_current_user)):
    screened_by = str(current_user["_id"])
    try:
        deleted = await delete_screening(screening_id, screened_by=screened_by)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid screening id.")

    if not deleted:
        raise HTTPException(status_code=404, detail="Screening not found.")

    return {"message": "Screening deleted."}

BULK_MATCH_CONCURRENCY = 3
match_semaphore = asyncio.Semaphore(BULK_MATCH_CONCURRENCY)


async def _match_and_save_one(parsed_resume: dict, jd_text: str, job_title: str, screened_by: str) -> dict:
    """Match one resume against the JD, save it, return a summary for ranking."""
    async with match_semaphore:
        try:
            loop = asyncio.get_event_loop()
            match_result = await loop.run_in_executor(
                None, match_resume_with_jd, parsed_resume, jd_text
            )

            if "error" in match_result:
                return {
                    "candidate_name": parsed_resume.get("name", "Unknown"),
                    "status": "failed",
                    "error": match_result["error"]
                }

            saved = await build_and_save_screening(
                jd_text=jd_text,
                parsed_resume=parsed_resume,
                match_result=match_result,
                screened_by=screened_by,
                job_title=job_title
            )
            saved.pop("resume_embedding", None)
            saved["status"] = "success"
            return saved

        except Exception as e:
            return {
                "candidate_name": parsed_resume.get("name", "Unknown"),
                "status": "failed",
                "error": str(e)
            }
