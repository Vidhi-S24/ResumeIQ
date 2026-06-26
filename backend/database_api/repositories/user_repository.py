from datetime import datetime
from database_api.database.mongodb import users_collection


async def get_user_by_email(email: str):
    return await users_collection.find_one({"email": email})


async def create_user(user_data: dict):
    result = await users_collection.insert_one(user_data)
    return result.inserted_id


async def get_user_by_id(user_id):
    return await users_collection.find_one({"_id": user_id})


async def update_last_login(user_id):
    await users_collection.update_one(
        {"_id": user_id},
        {
            "$set": {
                "last_login": datetime.utcnow()
            }
        }
    )