from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    company_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    company_name: str
    created_at: datetime


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    email: EmailStr