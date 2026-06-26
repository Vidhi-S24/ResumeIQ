from datetime import datetime
from bson import ObjectId
from database_api.database.mongodb import candidate_screenings_collection


async def save_screening(screening_doc: dict) -> str:
    screening_doc["created_at"] = datetime.utcnow()
    result = await candidate_screenings_collection.insert_one(screening_doc)
    return str(result.inserted_id)

async def get_screenings(
    screened_by: str,
    skip: int = 0,
    limit: int = 10,
    verdict: str = None,
    search: str = None
) -> list:
    """List screenings belonging to the logged-in user, optionally filtered by search text."""
    query = {"screened_by": screened_by}

    if verdict:
        query["verdict"] = verdict

    if search:
        query["$or"] = [
            {"candidate_name": {"$regex": search, "$options": "i"}},
            {"job_description.job_title": {"$regex": search, "$options": "i"}},
        ]

    cursor = candidate_screenings_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    return [doc async for doc in cursor]


async def count_screenings(screened_by: str, verdict: str = None, search: str = None) -> int:
    """Count total matching screenings — needed to calculate totalPages correctly."""
    query = {"screened_by": screened_by}

    if verdict:
        query["verdict"] = verdict

    if search:
        query["$or"] = [
            {"candidate_name": {"$regex": search, "$options": "i"}},
            {"job_description.job_title": {"$regex": search, "$options": "i"}},
        ]

    return await candidate_screenings_collection.count_documents(query)

async def get_screening_by_id(screening_id: str, screened_by: str):
    """Only returns the screening if it belongs to this user."""
    return await candidate_screenings_collection.find_one({
        "_id": ObjectId(screening_id),
        "screened_by": screened_by
    })


async def delete_screening(screening_id: str, screened_by: str) -> bool:
    """Only deletes if it belongs to this user."""
    result = await candidate_screenings_collection.delete_one({
        "_id": ObjectId(screening_id),
        "screened_by": screened_by
    })
    return result.deleted_count > 0


async def get_stats_overview(screened_by: str) -> dict:
    """Stats scoped to only this user's screenings."""
    base_query = {"screened_by": screened_by}

    total = await candidate_screenings_collection.count_documents(base_query)
    qualified = await candidate_screenings_collection.count_documents({**base_query, "verdict": "QUALIFIED"})

    avg_score_cursor = candidate_screenings_collection.aggregate([
        {"$match": base_query},
        {"$group": {"_id": None, "avg_score": {"$avg": "$overall_score"}}}
    ])
    avg_score_doc = await avg_score_cursor.to_list(length=1)
    avg_score = round(avg_score_doc[0]["avg_score"]) if avg_score_doc else 0

    distinct_candidates = await candidate_screenings_collection.distinct("candidate_name", base_query)

    return {
        "total_screenings": total,
        "average_score": avg_score,
        "shortlisted_count": qualified,
        "total_candidates": len(distinct_candidates),
    }


async def get_top_missing_skills(screened_by: str, limit: int = 5) -> list:
    """Scoped to only this user's screenings."""
    pipeline = [
        {"$match": {"screened_by": screened_by}},
        {"$unwind": "$missing_skills"},
        {"$group": {"_id": "$missing_skills", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]
    cursor = candidate_screenings_collection.aggregate(pipeline)
    return [doc async for doc in cursor]


async def get_top_required_skills(screened_by: str, limit: int = 5) -> list:
    """Scoped to only this user's screenings."""
    pipeline = [
        {"$match": {"screened_by": screened_by}},
        {"$unwind": "$job_description.required_skills"},
        {"$group": {"_id": "$job_description.required_skills", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]
    cursor = candidate_screenings_collection.aggregate(pipeline)
    return [doc async for doc in cursor]


async def get_recent_screenings(screened_by: str, limit: int = 5) -> list:
    """Scoped to only this user's screenings."""
    cursor = candidate_screenings_collection.find(
        {"screened_by": screened_by}
    ).sort("created_at", -1).limit(limit)
    return [doc async for doc in cursor]