from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict
import time

class User(BaseModel): # schema for "credentials" collection
    user_email: EmailStr
    user_name: str = Field(..., min_length=6)
    password: str = Field(..., min_length=4)
    user_id : str


class UserInteractionRaw(BaseModel):
    user_id: str
    timestamp: int = Field(default_factory=lambda: int(time.time()))
    prompt: str
    answer: str
    metadata: Optional[Dict] = None


class UserInteractionSummary(BaseModel): 
    user_id: str
    timestamp: int = Field(default_factory=lambda: int(time.time()))
    summary: str
    metadata: Optional[Dict] = None # can store additional metadata if needed


class UserProfile(BaseModel): # schema for user profile information
    user_id: str
    full_name: Optional[str] = None
    age: int
    # TODO

class Blog(BaseModel): # schema for blog posts
    blog_id: str
    title: str
    content: str
    keywords: list[str]
    author: Optional[str] = None




   