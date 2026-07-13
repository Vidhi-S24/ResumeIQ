from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from database_api.services.assistant_service import ask_assistant
from database_api.dependencies.auth_dependency import get_current_user

router = APIRouter(prefix="/assistant", tags=["Assistant"])

from typing import List, Literal
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AssistantRequest(BaseModel):
    question: str
    history: List[ChatMessage] = []


@router.post("/ask")
async def ask(request: AssistantRequest, current_user=Depends(get_current_user)):
    """
    Full RAG endpoint:
    - Receives a question from the HR user
    - Retrieves relevant candidates via vector search
    - Generates a natural language answer using Groq
    - Returns the answer + the source candidates it used
    """
    if not request.question.strip():
        raise HTTPException(status_code=422, detail="Question cannot be empty.")

    result = await ask_assistant(
        question=request.question,
        screened_by=str(current_user["_id"]),
        history=request.history
    )
    return result


@router.post("/search")
async def assistant_search(request: AssistantRequest, current_user=Depends(get_current_user)):
    """
    Retrieval only — returns raw candidate matches without Groq generation.
    Useful for testing the retrieval layer independently.
    """
    from database_api.services.assistant_service import retrieve_candidates
    results = await retrieve_candidates(request.question, str(current_user["_id"]))
    return {"question": request.question, "results": results}