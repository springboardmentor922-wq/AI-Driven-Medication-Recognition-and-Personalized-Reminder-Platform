from pydantic import BaseModel, EmailStr
from typing import Optional

# --- User Registration & Output ---
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "patient"  # "patient", "caregiver", or "admin"

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True

# --- Login & JWT Token ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    id: int
    email: str
    role: str
    full_name: str


# --- Patient Profile ---
class ProfileUpdate(BaseModel):
    age: Optional[int] = None
    medical_conditions: Optional[str] = None
    emergency_contact: Optional[str] = None

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    age: Optional[int]
    medical_conditions: Optional[str]
    emergency_contact: Optional[str]

    class Config:
        from_attributes = True
