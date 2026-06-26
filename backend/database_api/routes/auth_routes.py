from fastapi import APIRouter, HTTPException, Depends

from database_api.schemas.auth_schema import RegisterRequest, LoginRequest
from database_api.services.auth_service import register_user, login_user
from database_api.dependencies.auth_dependency import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
async def register(request: RegisterRequest):
    try:
        return await register_user(request)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    
@router.post("/login")
async def login(request: LoginRequest):

    return await login_user(request)

@router.get("/me")
async def get_logged_in_user(
    current_user=Depends(get_current_user)
):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "company_name": current_user["company_name"]
    }