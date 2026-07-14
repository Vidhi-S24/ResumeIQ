import os
# from sentence_transformers import SentenceTransformer
from database_api.services.embedding_service import generate_embedding
from groq import Groq
from dotenv import load_dotenv

from database_api.database.mongodb import candidate_screenings_collection

load_dotenv()

SYSTEM_RULES = """
You are ResumeIQ Assistant, an AI hiring assistant.

You answer recruiter questions using ONLY the candidate information provided in the user message.

Rules:

1. Before answering, check whether the candidate information actually contains the answer.

2. If the information is missing:
- Do not guess.
- Do not infer.
- Do not create relationships between candidates and unknown skills, projects, products, or tasks.

Respond:
"I don't have enough information from the screened resumes to answer this question."

3. Candidate data being available does NOT mean it is relevant.

4. You can answer:
- Candidate comparisons
- Who is qualified and why
- Screening scores
- Matched and missing skills
- Resume evaluation
- Hiring recommendations
- Shortlisting decisions

5. Never mention:
- database
- MongoDB
- embeddings
- vector search
- internal architecture
- retrieval process

6. If the user asks something outside hiring or candidate evaluation:
"I can only assist with candidate screening, resume evaluation, and hiring-related questions."

7. Keep answers concise and professional.

Examples:

Question:
"Who can make Maggie?"

Candidate information:
Contains only AI/ML and Full Stack candidates.

Correct:
"I don't have enough information from the screened resumes to answer this question."

Incorrect:
"Vidhi can make Maggie because he knows React."

Question:
"Compare Sarah and Vidhi."

Correct:
Compare their skills, scores, strengths, and gaps.
"""

# MODELS

# print("Loading embedding model...")

# embedding_model = SentenceTransformer(
#     "BAAI/bge-small-en-v1.5"
# )

# print("Embedding model loaded")

groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

GROQ_MODEL = "llama-3.1-8b-instant"
# GROQ_MODEL = "llama-3.3-70b-versatile"

# PROMPT LOADER

PROMPTS_DIR = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "app",
    "services",
    "prompts"
)

def load_prompt(filename):
    path = os.path.join(
        PROMPTS_DIR,
        filename
    )
    with open(
        path,
        "r",
        encoding="utf-8"
    ) as f:
        return f.read()

# SECURITY GUARDRAIL

def input_guardrail(question):
    blocked = [
        "api key",
        "password",
        "secret",
        "system prompt",
        "developer message",
        "jailbreak"
    ]
    q = question.lower()
    for word in blocked:
        if word in q:
            return {
                "allowed":False,
                "message":
                "I can only help with candidate screening and hiring related questions."
            }
    return {
        "allowed":True
    }

# AI RETRIEVAL DECISION

def decide_retrieval(question):
    prompt=f"""

You are a retrieval planner for an HR resume assistant.

Question:
{question}

Decide where information should come from.
Return ONLY:
ALL
or
SEARCH

ALL:
Use when user needs:
- counts
- totals
- statistics
- all candidates
- list candidates
- overall hiring information

SEARCH:
Use when user needs:
- candidate comparison
- specific candidate analysis
- skills matching
- resume explanation
- best candidates

Answer only one word.
"""
    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role":"user",
                "content":prompt
            }
        ],
        temperature=0
    )
    result=response.choices[0].message.content.strip()
    if result not in [
        "ALL",
        "SEARCH"
    ]:
        result="SEARCH"
    return result

# GET ALL USER CANDIDATES
async def get_all_candidates(
        screened_by
):
    cursor = candidate_screenings_collection.find(
        {
            "screened_by":screened_by
        },
        {
            "_id":0,
            "candidate_name":1,
            "job_description":1,
            "verdict":1,
            "overall_score":1,
            "matched_skills":1,
            "missing_skills":1,
            "strengths":1,
            "gaps":1,
            "ai_review":1,
            "ai_recommendation":1
        }
    )
    results=[]
    async for doc in cursor:
        results.append(doc)
    return results

# VECTOR SEARCH
async def semantic_search(
        question,
        screened_by,
        limit=10
):
    # vector = embedding_model.encode(
    #     question
    # ).tolist()
    vector = generate_embedding(question)

    pipeline=[
        {
        "$vectorSearch":{
            "index":"vector_index",
            "path":"resume_embedding",
            "queryVector":vector,
            "numCandidates":100,
            "limit":limit,
            "filter":{
                "screened_by":screened_by
            }
        }
        },
        {
        "$project":{
            "_id":0,
            "candidate_name":1,
            "job_description":1,
            "verdict":1,
            "overall_score":1,
            "matched_skills":1,
            "missing_skills":1,
            "strengths":1,
            "gaps":1,
            "ai_review":1,
            "ai_recommendation":1
        }
        }
    ]
    results=[]
    async for doc in candidate_screenings_collection.aggregate(
        pipeline
    ):
        results.append(doc)
    return results

# CONTEXT BUILDER
def build_context(candidates):
    if not candidates:

        return """
No candidate information available.
"""
    context=[]
    for c in candidates:
        context.append(
f"""
Candidate Name:
{c.get("candidate_name")}
Role:
{c.get("job_description",{}).get("job_title")}

Verdict:
{c.get("verdict")}
Score:
{c.get("overall_score")}
Matched Skills:
{c.get("matched_skills")}
Missing Skills:
{c.get("missing_skills")}
Strengths:
{c.get("strengths")}
Gaps:
{c.get("gaps")}
Review:
{c.get("ai_review")}
Recommendation:
{c.get("ai_recommendation")}


"""
        )
    return "\n".join(context)

# MAIN ASSISTANT
async def ask_assistant(
    question,
    screened_by,
    history=None
):
    if history is None:
        history = []
   
    # security check
    guard=input_guardrail(question)
    if not guard["allowed"]:
        return {
            "question":question,
            "answer":guard["message"],
            "sources":[]
        }
    # decide retrieval
    strategy=decide_retrieval(
        question
    )
    if strategy=="ALL":
        candidates=await get_all_candidates(
            screened_by
        )
    else:
        candidates=await semantic_search(
            question,
            screened_by
        )
        # Build candidate context
    context = build_context(candidates)

    # Load prompt template
    prompt_template = load_prompt("assistant_prompt.txt")

    # Convert previous conversation into text
    history_text = "\n".join(
        f"{msg.role.capitalize()}: {msg.content}"
        for msg in history[-6:]
    )

    # Create final prompt
    prompt = prompt_template.format(
        candidate_context=context,
        history=history_text,
        question=question
    )

    # Prepare messages for Groq
    messages = [
        {
            "role": "system",
            "content": SYSTEM_RULES
        }
    ]

    # Add conversation history
    messages.extend(
        [
            {
                "role": msg.role,
                "content": msg.content
            }
            for msg in history
        ]
    )

    # Add current request
    messages.append(
        {
            "role": "user",
            "content": prompt
        }
    )

    # Generate response
    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=0.2,
        max_tokens=700
    )

    answer = response.choices[0].message.content.strip()

    return {
        "question": question,
        "strategy": strategy,
        "answer": answer,
        "sources": candidates
    }