from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas, auth
from .database import engine, get_db

# Automatically creates the tables inside pillsync.db
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PillSync: Intelligent Medicine Reminder API")

# Allows our React frontend (port 5173) to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "PillSync Backend is running!"}

# 1. Register a New User (Patient, Caregiver, or Admin)
@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if user.role not in ["patient", "caregiver", "admin"]:
        raise HTTPException(status_code=400, detail="Role must be patient, caregiver, or admin")

    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=auth.hash_password(user.password),
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automatically create an empty health profile if the user is a patient
    if new_user.role == "patient":
        new_profile = models.PatientProfile(user_id=new_user.id)
        db.add(new_profile)
        db.commit()

    return new_user

# 2. Login & Receive JWT Token
@app.post("/login", response_model=schemas.Token)
def login_user(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
    }


# 3. Get Current Logged-in User Info
@app.get("/users/me", response_model=schemas.UserResponse)
def get_my_info(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# 4. View & Update Patient Profile
@app.get("/profile", response_model=schemas.ProfileResponse)
def get_my_profile(
    current_user: models.User = Depends(auth.require_role(["patient"])),
    db: Session = Depends(get_db),
):
    profile = db.query(models.PatientProfile).filter(models.PatientProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.put("/profile", response_model=schemas.ProfileResponse)
def update_my_profile(
    profile_data: schemas.ProfileUpdate,
    current_user: models.User = Depends(auth.require_role(["patient"])),
    db: Session = Depends(get_db),
):
    profile = db.query(models.PatientProfile).filter(models.PatientProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if profile_data.age is not None:
        profile.age = profile_data.age
    if profile_data.medical_conditions is not None:
        profile.medical_conditions = profile_data.medical_conditions
    if profile_data.emergency_contact is not None:
        profile.emergency_contact = profile_data.emergency_contact

    db.commit()
    db.refresh(profile)
    return profile

# 5. Admin-Only Endpoint (Demonstrates Role-Based Access Control)
@app.get("/admin/users", response_model=list[schemas.UserResponse])
def list_all_users(
    current_user: models.User = Depends(auth.require_role(["admin"])),
    db: Session = Depends(get_db),
):
    return db.query(models.User).all()
class UserUpdate(BaseModel):
    full_name: str
    role: str

@app.put("/users/{user_id}")
def update_user_profile(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.full_name = user_data.full_name
    user.role = user_data.role
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
    }
