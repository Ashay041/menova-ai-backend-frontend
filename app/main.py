from fastapi import FastAPI, HTTPException, Depends, status, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
import uuid
import asyncio

from agents.recommend import RecommendationAgent
from agents.emotional_agent import EmotionalSupportAgent
from agents.appointment import AppointmentAgent
from rag.rag_with_memory import MedicalRAGPipelineWithMemory
from database.db import get_mongo_database
from database.db_dao import *
from app.app_schemas import *

from datetime import date, datetime, timedelta


app = FastAPI()
db = get_mongo_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Consider restricting in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_agent = MedicalRAGPipelineWithMemory(db)
recommend_agent = RecommendationAgent(db)
emotional_agent = EmotionalSupportAgent()
appointment_agent = AppointmentAgent()


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
emotional_user_sessions = {}


def generate_user_id():
    return str(uuid.uuid4())


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization.split(" ")[1]
    payload = verify_access_token(token)
    user = get_user(db, payload.get("user_id"))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_inactive_sessions())


@app.on_event("shutdown")
async def shutdown_event():
    print("Application shutting down, cleaning up all chat sessions")
    emotional_agent._cleanup_all_sessions()


async def cleanup_inactive_sessions():
    """Background task to clean up inactive sessions."""
    while True:
        await asyncio.sleep(3600) 
        emotional_agent._cleanup_expired_sessions()


@app.post("/auth/signup")
async def signup(request: EnhancedSignupRequest):
    """Enhanced signup that collects menopause-specific information"""
    try:
        print("Signup request received:", request)
        user_id = generate_user_id()
        
        # Add user to credentials
        result = add_user(db, user_id, request.user_name, request.user_email, request.password)
        if result != "":
            raise HTTPException(status_code=400, detail=result)
            
        # Create initial profile with menopause information
        create_user_profile(
            db,
            user_id=user_id,
            age=request.age,
            stage=request.menopause_stage,
            symptoms=request.symptoms
        )
        
        token = create_access_token(data={"user_id": user_id})
        return {"message": "User registered successfully", "user_id": user_id, "token": token}
    except Exception as e:
        print("Signup error:", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = authenticate_user(db, request.user_name, request.password)
    if isinstance(user, str):
        # If the authentication function returns a string, it means there was an error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=user
        )
    token = create_access_token(data={"user_id": user["user_id"]})
    return LoginResponse(token=token, user_id=user["user_id"])

@app.post("/chat/start", response_model=ChatStartResponse)
async def start_chat(current_user: dict = Depends(get_current_user)):
    return ChatStartResponse(
        user_id=current_user["user_id"],
        message="Chat session started."
    )

@app.post("/chat/message", response_model=MessageResponse)
async def process_message(request: MessageRequest, current_user: dict = Depends(get_current_user)):
    # if request.user_id != current_user["user_id"]:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")
    
    start_time = datetime.now()

    if request.query.startswith('/appointment'):
        result = await appointment_agent.create_appointment(request.query)
        
        if result['status'] == 'error':
            return MessageResponse(
                response=f"Sorry, I couldn't create that appointment: {result['message']}",
                author="MenopauseBot"
            )
        else:
            return MessageResponse(
                response=f"I've added your appointment to your calendar! {result['link']}",
                author="MenopauseBot"
            )
    elif request.query.startswith('/find-doctor'):
        stripped_query = request.query.replace('/find-doctor', '').strip()

        doctor_list = [
            {"name": "Dr. Jane Smith", "specialty": "Gynecology", "location": "215 Downtown Pittsburgh", "Availability": "10AM - 2PM, 4PM - 6PM", "Rating": "4.5", "Days":"Monday, Wednesday, Friday"},
            {"name": "Dr. Emily Johnson", "specialty": "Gynecology", "location": "5714 Beacon Street", "Availability": "11AM - 3PM, 5PM - 7PM", "Rating": "4.7", "Days":"Tuesday, Thursday"},
            {"name": "Dr. Sarah Brown", "specialty": "Gynecology", "location": "613 Ellsworth Street", "Availability": "9AM - 1PM, 3PM - 5PM", "Rating": "4.1", "Days" :"Monday, Wednesday, Thursday"},
        ]
        return MessageResponseDoctor(
            response=f"Here are the top 3 doctors specializing in {stripped_query} in your area:",
            doctor_list= doctor_list,
            author="MenopauseBot"
        )
    else:
        result = await rag_agent.query_with_memory(
            query=request.query,
            user_id=current_user["user_id"]
        )
        end_time = datetime.now()
    
        return MessageResponse(response=result["answer"], author="MenopauseBot")


@app.get("/recommend/blogs", response_model=BlogListResponse)
async def recommend_blogs(current_user: dict = Depends(get_current_user)):
    blogs = recommend_agent.get_recommended_blogs(db, current_user["user_id"])
    return BlogListResponse(blogs=blogs)



@app.post("/chat/maya/start", response_model=MessageResponse)
async def start_emotional_chat(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    
    session_id = emotional_agent.create_session()
    emotional_user_sessions[user_id] = session_id
    
    emotional_agent.add_conversation_context(
        session_id=session_id,
        context=f"New conversation started with user ID: {user_id}"
    )
    
    return MessageResponse(
        user_id=user_id,
        session_id=session_id,
        message="Hi I'm Maya, your friend, and your emotional support agent. I'm here to listen and help you with your feelings. This conversation is completely private and will not influence your MenopauseAgent. You can talk to me about anything that's on your mind!"
    )


@app.post("/chat/maya/message", response_model=MessageResponse)
async def process_emotional_message(request: MessageRequest,current_user: dict = Depends(get_current_user)):
    # Validate user ID
    if request.user_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")
    
    if request.session_id not in emotional_agent.sessions:
        request.session_id = emotional_agent.create_session()
        emotional_user_sessions[request.user_id] = request.session_id
    
    start_time = datetime.now()
    result = await emotional_agent.chat(
        query=request.query,
        session_id=request.session_id
    )
    end_time = datetime.now()
    
    # processing_time = (end_time - start_time).total_seconds()
    # print(f"Emotional query processed in {processing_time:.2f} seconds")
    
    return MessageResponse(
        response=result["response"],
        author="Maya",  # Using your specified author name
        session_id=request.session_id
    )
    return MessageResponse(response=result["answer"], author="MenopauseBot")

@app.get("/user/profile")
async def get_user_profile_endpoint(current_user: dict = Depends(get_current_user)):
    """Get the current user's profile"""
    try:
        profile = get_user_profile(db, current_user["user_id"])
        if not profile:
            return {"message": "Profile not found"}
            
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

@app.put("/user/profile")
async def update_user_profile_endpoint(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update the current user's profile"""
    try:
        user_id = current_user["user_id"]
        
        # Get the request body
        profile_data = await request.json()
        
        # Remove any _id key if present
        if "_id" in profile_data:
            del profile_data["_id"]
            
        # Don't allow changing user_id
        if "user_id" in profile_data:
            del profile_data["user_id"]
            
        # Update last_updated timestamp
        profile_data["last_updated"] = datetime.now().isoformat()
        
        # Update the profile
        db['user_profiles'].update_one(
            {"user_id": user_id},
            {"$set": profile_data},
            upsert=True
        )
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")


@app.get("/user/daily-summaries/{user_id}")
async def get_user_daily_summaries(
    user_id: str, 
    limit: int = 7, 
    current_user: dict = Depends(get_current_user)
):
    """Get the user's daily conversation summaries"""
    if user_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")
        
    try:
        from database.db_dao import get_user_daily_summaries
        summaries = get_user_daily_summaries(db, user_id, limit)
        
        # Clean up the response
        clean_summaries = []
        for summary in summaries:
            if "_id" in summary:
                del summary["_id"]
            clean_summaries.append(summary)
            
        return {"daily_summaries": clean_summaries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving summaries: {str(e)}")


@app.get("/user/medium-term-memory/{user_id}")
async def get_user_medium_term_memory(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the user's medium-term memory"""
    if user_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")
        
    try:
        from database.db_dao import get_user_embeddings_by_type
        medium_term = get_user_embeddings_by_type(db, user_id, "medium_term")
        
        # Clean up the response (remove embeddings and ObjectIds)
        clean_memories = []
        for memory in medium_term:
            memory_copy = {
                "summary": memory.get("summary", ""),
                "created_at": memory.get("metadata", {}).get("created_at", "")
            }
            clean_memories.append(memory_copy)
            
        return {"medium_term_memories": clean_memories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving medium-term memory: {str(e)}")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/symptoms/log")
async def log_symptom(
    request: SymptomLog,
    current_user: dict = Depends(get_current_user)
):
    """Log a new symptom entry for a user"""
    if request.user_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")
    
    try:
        from database.db_dao import log_symptom
        
        # Validate symptom type
        if request.symptom.lower() not in SYMPTOM_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Invalid symptom type. Must be one of: {', '.join(SYMPTOM_TYPES)}"
            )
        
        # Log the symptom
        success = log_symptom(
            db,
            request.user_id,
            request.date,
            request.symptom.lower(),
            request.severity
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to log symptom"
            )
            
        return {"success": True, "message": "Symptom logged successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error logging symptom: {str(e)}"
        )


@app.post("/symptoms/weekly")
async def get_weekly_symptoms(
    request: WeeklySymptomRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get all symptoms logged for a user in a specific week"""
    if request.user_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID mismatch")
    
    try:
        from database.db_dao import get_weekly_symptoms
        
        # Get the weekly symptoms
        result = get_weekly_symptoms(
            db,
            request.user_id,
            request.start_date
        )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving symptoms: {str(e)}"
        )


@app.get("/symptoms/types", response_model=SymptomTypesResponse)
async def get_symptom_types():
    """Get the list of available symptom types"""
    return {"symptom_types": SYMPTOM_TYPES}


@app.get("/user/insights")
async def user_insights(current_user: dict = Depends(get_current_user)):
    data = await rag_agent.generate_insights_and_next_steps(current_user["user_id"])
    return {
        "triggers": data["triggers"],
        "next_steps": data["next_steps"],
    }
