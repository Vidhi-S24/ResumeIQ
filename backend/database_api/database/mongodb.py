from motor.motor_asyncio import AsyncIOMotorClient

from database_api.config import (
    MONGODB_URL,
    DATABASE_NAME,
)

# MongoDB Client
client = AsyncIOMotorClient(MONGODB_URL)

# Database
db = client[DATABASE_NAME]

# Collections
users_collection = db["users"]
candidate_screenings_collection = db["candidate_screenings"]