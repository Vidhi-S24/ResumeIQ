from database_api.repositories.screening_repository import save_screening
from app.services.groq_client_service import parse_jd_with_llm
from database_api.services.embedding_service import generate_screening_embedding

def _serialize_screening(doc: dict) -> dict:
    """Convert MongoDB's ObjectId and other fields into JSON-friendly types."""
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    doc["screened_by"] = str(doc["screened_by"])
    return doc


async def build_and_save_screening(
    jd_text: str,
    parsed_resume: dict,
    match_result: dict,
    screened_by: str,
    job_title: str = None
) -> dict:
    """Take the AI's match result and persist only the review — not the full resume."""

    parsed_jd = parse_jd_with_llm(jd_text)

    screening_doc = {
        "candidate_name": parsed_resume.get("name", "Unknown"),
        "screened_by": screened_by,
        "job_description": {
            "job_title": job_title or parsed_jd.get("job_title"),
            "raw_text": jd_text,
            "required_skills": parsed_jd.get("required_skills", []),
            "preferred_skills": parsed_jd.get("preferred_skills", []),
            "required_experience": parsed_jd.get("required_experience"),
            "education_requirements": parsed_jd.get("education_requirements", []),
            "responsibilities": parsed_jd.get("responsibilities", []),
        },
        "verdict": match_result.get("verdict"),
        "overall_score": match_result.get("overall_score"),
        "dimension_scores": match_result.get("dimension_scores"),
        "score_breakdown": match_result.get("score_breakdown"),
        "matched_skills": match_result.get("matched_skills", []),
        "missing_skills": match_result.get("missing_skills", []),
        "strengths": match_result.get("strengths", []),
        "gaps": match_result.get("gaps", []),
        "ai_review": match_result.get("summary"),
        "ai_recommendation": match_result.get("recommendation"),
    }
    print(f"Generating embedding for: {screening_doc['candidate_name']}")
    screening_doc["resume_embedding"] = generate_screening_embedding(screening_doc)
    print(f"✅ Embedding generated — {len(screening_doc['resume_embedding'])} dimensions")

    screening_id = await save_screening(screening_doc)
    screening_doc.pop("_id", None)

    screening_doc["id"] = screening_id
    return screening_doc