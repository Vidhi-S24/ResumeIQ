from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.groq_client_service import parse_resume_with_llm, match_resume_with_jd
from app.services.text_extraction_service import extract_pdf_text, extract_docx_text
import asyncio
import os
import json
import traceback

router = APIRouter()

UPLOAD_DIR = "app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    # Save uploaded file
    filepath = os.path.join(UPLOAD_DIR, file.filename)

    try:
        contents = await file.read()
        with open(filepath, "wb") as buffer:
            buffer.write(contents)
    except Exception as e:
        print(f"❌ File save error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    try:
        if file.filename.lower().endswith(".pdf"):
            text = extract_pdf_text(filepath)
        else:
            text = extract_docx_text(filepath)
    except Exception as e:
        print(f"❌ Text extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")

    if not text or not text.strip():
        return {"error": "Could not extract text from the file. It may be a scanned/image PDF."}

    print("\n===== EXTRACTED TEXT =====")
    print(text)
    print("==========================\n")
    try:
        loop = asyncio.get_event_loop()
        parsed = await loop.run_in_executor(None, parse_resume_with_llm, text)
    except ConnectionError as e:
        print(f"❌ Ollama not running: {e}")
        raise HTTPException(status_code=503, detail="Ollama is not running. Start Ollama and try again.")
    except TimeoutError as e:
        print(f"❌ Ollama timeout: {e}")
        raise HTTPException(status_code=504, detail="Model took too long. Try again.")
    except Exception as e:
        print(f"❌ LLM error: {e}")
        raise HTTPException(status_code=500, detail=f"Model parsing failed: {str(e)}")

    print("\n===== PARSED RESUME =====")
    print(json.dumps(parsed, indent=2))
    print("=========================\n")

    return {
        "filename": file.filename,
        "parsed_resume": parsed
    }


@router.post("/analyze-resume")
async def analyze_resume(payload: dict):

    print("ANALYZE PAYLOAD:", payload)

    jd_text = payload.get("jd_text", "").strip()
    parsed_resume = payload.get("parsed_resume")

    if not jd_text:
        raise HTTPException(
            status_code=422,
            detail="Job description is required."
        )

    if not parsed_resume:
        raise HTTPException(
            status_code=422,
            detail="Parsed resume is required."
        )

    try:
        loop = asyncio.get_event_loop()

        result = await loop.run_in_executor(
            None,
            match_resume_with_jd,
            parsed_resume,
            jd_text
        )

    except Exception as e:
        print("❌ FULL ERROR:")
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    return result

BULK_CONCURRENCY_LIMIT = 3

semaphore = asyncio.Semaphore(BULK_CONCURRENCY_LIMIT)


async def _process_single_resume(file: UploadFile) -> dict:
    """Process one resume file: save, extract text, parse with LLM.
    Wrapped with the semaphore so only a few run at once."""
    async with semaphore:
        filepath = os.path.join(UPLOAD_DIR, file.filename)

        try:
            contents = await file.read()
            with open(filepath, "wb") as buffer:
                buffer.write(contents)
        except Exception as e:
            return {"filename": file.filename, "status": "failed", "error": f"File save failed: {str(e)}"}

        try:
            if file.filename.lower().endswith(".pdf"):
                text = extract_pdf_text(filepath)
            else:
                text = extract_docx_text(filepath)
        except Exception as e:
            return {"filename": file.filename, "status": "failed", "error": f"Text extraction failed: {str(e)}"}

        if not text or not text.strip():
            return {"filename": file.filename, "status": "failed", "error": "Could not extract text. File may be scanned/image-based."}

        try:
            loop = asyncio.get_event_loop()
            parsed = await loop.run_in_executor(None, parse_resume_with_llm, text)
        except Exception as e:
            return {"filename": file.filename, "status": "failed", "error": f"AI parsing failed: {str(e)}"}

        if "error" in parsed:
            return {"filename": file.filename, "status": "failed", "error": parsed["error"]}

        return {"filename": file.filename, "status": "success", "parsed_resume": parsed}


@router.post("/upload-resumes-bulk")
async def upload_resumes_bulk(files: list[UploadFile] = File(...)):
    """Upload and parse multiple resumes at once.
    Each resume is processed independently — if one fails, the others still succeed."""

    if len(files) == 0:
        raise HTTPException(status_code=422, detail="No files provided.")

    if len(files) > 50:
        raise HTTPException(status_code=422, detail="Maximum 50 resumes per batch.")

    results = await asyncio.gather(*[_process_single_resume(f) for f in files])

    success_count = sum(1 for r in results if r["status"] == "success")
    failed_count = len(results) - success_count

    return {
        "total": len(results),
        "success_count": success_count,
        "failed_count": failed_count,
        "results": results,
    }