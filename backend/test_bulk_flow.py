"""
test_bulk_flow.py

Tests the full bulk upload + bulk analyze pipeline end to end.
Run from inside backend/ folder:
    python test_bulk_flow.py

Make sure both servers are running first:
    uvicorn app.main:app --reload --port 8000
    uvicorn database_api.main:app --reload --port 8001
"""

import requests
import os
import json

CORE_API = "http://localhost:8000"
DATABASE_API = "http://localhost:8001"

# --- Step 1: Login ---
print("=" * 50)
print("STEP 1: LOGIN")
print("=" * 50)

login_response = requests.post(
    f"{DATABASE_API}/auth/login",
    json={"email": "xyz@example.com", "password": "password"}
)
print("Status:", login_response.status_code)

if login_response.status_code != 200:
    print("❌ Login failed:", login_response.text)
    exit(1)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("✅ Logged in successfully.\n")

# --- Step 2: Bulk upload resumes ---
print("=" * 50)
print("STEP 2: BULK UPLOAD")
print("=" * 50)

UPLOAD_FOLDER = "app/uploads"
resume_files = [
    f for f in os.listdir(UPLOAD_FOLDER)
    if f.lower().endswith((".pdf", ".docx"))
]

if not resume_files:
    print(f"❌ No resume files found in {UPLOAD_FOLDER}. Add some .pdf/.docx files there first.")
    exit(1)

print(f"Found {len(resume_files)} resume(s): {resume_files}\n")

files_payload = []
for fname in resume_files:
    filepath = os.path.join(UPLOAD_FOLDER, fname)
    files_payload.append(("files", (fname, open(filepath, "rb"))))

bulk_upload_response = requests.post(
    f"{CORE_API}/upload-resumes-bulk",
    files=files_payload
)

print("Status:", bulk_upload_response.status_code)

if bulk_upload_response.status_code != 200:
    print("❌ Bulk upload failed:", bulk_upload_response.text)
    exit(1)

upload_result = bulk_upload_response.json()
print(f"✅ Total: {upload_result['total']} | Success: {upload_result['success_count']} | Failed: {upload_result['failed_count']}\n")

for r in upload_result["results"]:
    status_icon = "✅" if r["status"] == "success" else "❌"
    print(f"  {status_icon} {r['filename']} — {r['status']}")
    if r["status"] == "failed":
        print(f"      Error: {r.get('error')}")

# Collect only successfully parsed resumes for the next step
successful_resumes = [
    r["parsed_resume"] for r in upload_result["results"] if r["status"] == "success"
]

if not successful_resumes:
    print("\n❌ No resumes parsed successfully. Cannot proceed to bulk analyze.")
    exit(1)

print(f"\n✅ {len(successful_resumes)} resume(s) ready for bulk analysis.\n")

# --- Step 3: Bulk analyze against one JD ---
print("=" * 50)
print("STEP 3: BULK ANALYZE + RANKING")
print("=" * 50)

bulk_analyze_response = requests.post(
    f"{DATABASE_API}/screenings/analyze-bulk",
    headers=headers,
    json={
        "jd_text": "We need a Python developer with 3+ years experience in machine learning, FastAPI, and SQL databases.",
        "job_title": "ML Engineer",
        "parsed_resumes": successful_resumes
    }
)

print("Status:", bulk_analyze_response.status_code)

if bulk_analyze_response.status_code != 200:
    print("❌ Bulk analyze failed:", bulk_analyze_response.text)
    exit(1)

analyze_result = bulk_analyze_response.json()
print(f"✅ Submitted: {analyze_result['total_submitted']} | Success: {analyze_result['success_count']} | Failed: {analyze_result['failed_count']}\n")

print("RANKED RESULTS (highest score first):")
print("-" * 50)
for r in analyze_result["ranked_results"]:
    print(f"#{r['rank']}  {r['candidate_name']:<25} Score: {r['overall_score']:<4} Verdict: {r['verdict']}")
    print(f"      Matched: {r['matched_skills']}")
    print(f"      Missing: {r['missing_skills']}")
    print()

if analyze_result["failed_results"]:
    print("FAILED RESULTS:")
    for r in analyze_result["failed_results"]:
        print(f"  ❌ {r['candidate_name']} — {r.get('error')}")

print("\n✅ Full bulk flow test complete.")