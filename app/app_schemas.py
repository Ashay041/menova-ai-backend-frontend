from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date

class LoginRequest(BaseModel):
    user_name: str
    user_email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user_id: str

class ChatStartResponse(BaseModel):
    user_id: str
    message: str

class MessageRequest(BaseModel):
    user_id: str
    query: str

class MessageResponse(BaseModel):
    response: str
    author: str

class MessageResponseDoctor(BaseModel):
    response: str
    doctor_list: List[Dict[str, Any]]
    author : str

class BlogListResponse(BaseModel):
    blogs: List[Dict]

class AppointmentRequest(BaseModel):
    user_id: str
    text: str

class AppointmentResponse(BaseModel):
    status: str
    message: str
    appointment_details: Optional[Dict[str, Any]] = None
    event_id: Optional[str] = None
class EnhancedSignupRequest(LoginRequest):
    """Extended signup request with menopause-specific information"""
    age: Optional[int] = None
    menopause_stage: Optional[str] = None
    symptoms: Optional[List[str]] = []

SYMPTOM_TYPES = [
    "hot flashes",
    "night sweats",
    "mood swings",
    "irregular periods",
    "vaginal dryness",
    "sleep issues",
    "memory issues",
    "brain fog",
    "fatigue",
    "joint pain",
    "low libido",
    "weight gain",
    "anxiety",
    "depression"
]

class SymptomLog(BaseModel):
    user_id: str
    date: date
    symptom: str
    severity: int = Field(..., ge=1, le=5)  # Ensure severity is between 1-5

class WeeklySymptomRequest(BaseModel):
    user_id: str
    start_date: date

class DailySymptomLog(BaseModel):
    date: date
    symptoms: List[Dict[str, Any]]

class WeeklySymptomResponse(BaseModel):
    user_id: str
    week_start: date
    symptoms: List[DailySymptomLog]

class SymptomTypesResponse(BaseModel):
    symptom_types: List[str]
