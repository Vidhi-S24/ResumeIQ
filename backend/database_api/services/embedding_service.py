# from sentence_transformers import SentenceTransformer

# # Load model once when the server starts — not on every request.
# # This takes ~2 seconds on first load but then stays in memory.
# print("Loading embedding model...")
# embedding_model = SentenceTransformer('BAAI/bge-small-en-v1.5')
# print("✅ Embedding model loaded.")


# def generate_screening_embedding(screening_doc: dict) -> list[float]:

#     candidate_name = screening_doc.get("candidate_name", "")
#     job_title = screening_doc.get("job_description", {}).get("job_title", "")
#     verdict = screening_doc.get("verdict", "")
#     overall_score = screening_doc.get("overall_score", 0)
#     matched_skills = ", ".join(screening_doc.get("matched_skills", []))
#     missing_skills = ", ".join(screening_doc.get("missing_skills", []))
#     ai_review = screening_doc.get("ai_review", "")
#     ai_recommendation = screening_doc.get("ai_recommendation", "")

#     text = f"""
#     Candidate: {candidate_name}
#     Applied for: {job_title}
#     Verdict: {verdict}
#     Match score: {overall_score} out of 100
#     Skills matched: {matched_skills}
#     Skills missing: {missing_skills}
#     AI review: {ai_review}
#     Recommendation: {ai_recommendation}
#     """.strip()

#     vector = embedding_model.encode(text)
#     return vector.tolist()

import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

# Create Gemini client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

EMBEDDING_MODEL = "gemini-embedding-001"


def generate_embedding(text: str) -> list[float]:
    """
    Generate an embedding vector using Gemini.
    """

    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
    )

    return response.embeddings[0].values


def generate_screening_embedding(screening_doc: dict) -> list[float]:
    """
    Generate embedding for a screened candidate.
    """

    candidate_name = screening_doc.get("candidate_name", "")
    job_title = screening_doc.get("job_description", {}).get("job_title", "")
    verdict = screening_doc.get("verdict", "")
    overall_score = screening_doc.get("overall_score", 0)

    matched_skills = ", ".join(
        screening_doc.get("matched_skills", [])
    )

    missing_skills = ", ".join(
        screening_doc.get("missing_skills", [])
    )

    ai_review = screening_doc.get("ai_review", "")

    ai_recommendation = screening_doc.get(
        "ai_recommendation",
        ""
    )

    text = f"""
Candidate: {candidate_name}
Applied for: {job_title}
Verdict: {verdict}
Match score: {overall_score} out of 100
Matched Skills: {matched_skills}
Missing Skills: {missing_skills}
AI Review: {ai_review}
Recommendation: {ai_recommendation}
"""

    return generate_embedding(text)