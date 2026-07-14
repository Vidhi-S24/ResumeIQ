from groq import Groq
from dotenv import load_dotenv
load_dotenv()

import re
import os
import json

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL_NAME = "llama-3.3-70b-versatile"
# MODEL_NAME = "llama-3.1-8b-instant"
# MODEL_NAME = "meta-llama/llama-4-scout-17b-16e-instruct"

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "prompts")


def _load_prompt_template(filename: str) -> str:
    """Read a prompt template file from the prompts/ folder."""
    filepath = os.path.join(PROMPTS_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def check_groq_connection() -> bool:
    """Verify Groq API key is set and the API is reachable."""
    if not os.environ.get("GROQ_API_KEY"):
        print("❌ GROQ_API_KEY not set. Set it in your .env file.")
        return False
    try:
        client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=5
        )
        print(f"✅ Groq API reachable. Model '{MODEL_NAME}' ready.")
        return True
    except Exception as e:
        print(f"❌ Groq API error: {e}")
        return False


def call_groq_model(prompt: str, max_tokens: int = 1500) -> str:
    """Send a prompt to Groq's chat completion endpoint and return raw text."""
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=max_tokens,
            top_p=0.9
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        error_msg = str(e).lower()
        if "api_key" in error_msg or "authentication" in error_msg:
            raise ConnectionError("Invalid or missing Groq API key.")
        if "rate" in error_msg or "429" in error_msg:
            raise TimeoutError("Groq rate limit hit. Wait a moment and try again.")
        raise RuntimeError(f"Groq request failed: {str(e)}")


def extract_json_from_model_output(raw: str) -> dict:
    """Strip markdown fences and extract JSON, auto-fixing truncated output."""
    clean = raw.replace("```json", "").replace("```", "").strip()
    clean = re.sub(r'[\x00-\x1f\x7f]', ' ', clean)
    start = clean.find("{")
    end = clean.rfind("}") + 1

    if start != -1 and end > start:
        try:
            return json.loads(clean[start:end])
        except json.JSONDecodeError:
            for closing in ["}", "\"}}", "\"}}}"]:
                try:
                    return json.loads(clean[start:] + closing)
                except json.JSONDecodeError:
                    continue

    print(f"⚠️ Could not parse JSON. Raw output:\n{raw}")
    return {"error": "JSON parse failed", "raw": raw}


def parse_resume_with_llm(resume_text: str) -> dict:
    """Call Groq to convert raw resume text into structured JSON."""
    resume_text = resume_text[:12000]

    prompt_template = _load_prompt_template("resume_parsing_prompt.txt")
    prompt = prompt_template.format(resume_text=resume_text)

    print("\n===== SENDING TO GROQ (RESUME PARSE) =====")
    raw = call_groq_model(prompt, max_tokens=1700)
    print("\n===== RAW MODEL OUTPUT =====")
    print(raw)
    print("============================\n")
    return extract_json_from_model_output(raw)


def parse_jd_with_llm(jd_text: str) -> dict:
    """Call Groq to convert raw job description text into structured JSON.
    Retries up to 3 times if the model output fails to parse."""
    prompt_template = _load_prompt_template("jd_parsing_prompt.txt")
    prompt = prompt_template.format(jd_text=jd_text)

    result = {"error": "No attempts made"}
    for _ in range(3):
        raw = call_groq_model(prompt, max_tokens=1200)
        result = extract_json_from_model_output(raw)
        if "error" not in result:
            return result

    return result


def match_resume_with_jd(parsed_resume: dict, jd_text: str) -> dict:
    """Compare a parsed resume against a job description and return
    the AI's verdict, score, and reasoning."""
    jd_text = jd_text[:5000]
    parsed_jd = parse_jd_with_llm(jd_text)

    resume_summary = json.dumps({
        "name": parsed_resume.get("name"),
        "total_experience_years": parsed_resume.get("total_experience_years"),
        "technical_skills": parsed_resume.get("technical_skills", []),
        "soft_skills": parsed_resume.get("soft_skills", []),
        "certifications": parsed_resume.get("certifications", []),
        "education": parsed_resume.get("education", []),
        "work_experience": [
            {
                "company": e.get("company"),
                "role": e.get("role"),
                "duration": e.get("duration"),
                "responsibilities": e.get("responsibilities", [])
            }
            for e in parsed_resume.get("work_experience", [])
        ],
        "projects": [
            {
                "name": p.get("name"),
                "description": p.get("description"),
                "tech_stack": p.get("tech_stack", [])
            }
            for p in parsed_resume.get("projects", [])
        ]
    }, indent=2)

    prompt_template = _load_prompt_template("resume_jd_matching_prompt.txt")
    prompt = prompt_template.format(
        parsed_jd=json.dumps(parsed_jd, indent=2),
        resume_summary=resume_summary
    )

    print("\n===== SENDING TO GROQ (JD MATCH) =====")
    raw = call_groq_model(prompt, max_tokens=2500)
    print("\n===== RAW MATCH OUTPUT =====")
    print(raw)
    print("============================\n")
    return extract_json_from_model_output(raw)
