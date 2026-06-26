from datetime import datetime
from fastapi import HTTPException
from database_api.repositories.user_repository import (
    get_user_by_email,
    create_user,
    update_last_login
)
from database_api.utils.password_utils import hash_password, verify_password
from database_api.services.jwt_service import (
    create_access_token
)

async def register_user(register_data):
    existing_user = await get_user_by_email(register_data.email)

    if existing_user:
        raise ValueError("Email already registered")

    user = {
        "name": register_data.name,
        "email": register_data.email.lower(),
        "password": hash_password(register_data.password),
        "company_name": register_data.company_name,
        "created_at": datetime.utcnow(),
        "last_login": None,
        "is_active": True
    }

    user_id = await create_user(user)

    return {
        "id": str(user_id),
        "message": "User registered successfully"
    }

async def login_user(request):

    user = await get_user_by_email(request.email)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_correct = verify_password(
        request.password,
        user["password"]
    )

    if not password_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        {
            "email": user["email"],
            "user_id": str(user["_id"])
        }
    )

    await update_last_login(
        str(user["_id"])
    )

    return {

        "access_token": token,

        "token_type": "Bearer",

        "user": {

            "id": str(user["_id"]),

            "name": user["name"],

            "email": user["email"],

            "company_name": user["company_name"]

        }

    }