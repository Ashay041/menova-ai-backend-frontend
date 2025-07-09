import bcrypt
from database.schema import *
from database.db_functions import *
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import pytz
from datetime import date, datetime
from app.app_schemas import SYMPTOM_TYPES

import nltk
nltk.download('punkt_tab')

def schema_to_collection(schema_obj) -> str:
    """Map schema objects to their corresponding collection names"""
    if issubclass(schema_obj, User):
        return "credentials"
    elif issubclass(schema_obj, UserInteractionRaw):
        return "ai_raw"
    elif issubclass(schema_obj, UserInteractionSummary):
        return "ai_summary"
    elif issubclass(schema_obj, Blog):
        return "blog"
    else:
        raise ValueError("No matching collection for the provided schema object.")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def authenticate_user(db, user_name: str, password: str):
    """Authenticate a user by username and password"""
    message = ""
    if not user_name or not password:
        message = "❌ Username and password must not be empty."
        return message
    
    user = fetch_collection_by_id_one(db, schema_to_collection(User), "user_name", user_name)
    print(user)

    if not user:
        message = "❌ User not found."
        return message

    if not bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
        message = "❌ Incorrect password."
        return message

    return user


def add_user(db, user_id: str, user_name: str, user_email: str, password: str):
    """Add a new user to the database"""
    message = ""
    if index_exists(db, schema_to_collection(User), "user_name", user_name):
        message = ("❌ Username already exists!")
        return message

    if index_exists(db, schema_to_collection(User), "user_email", user_email):
        message = ("❌ Email already exists!")
        return message

    hashed_password = hash_password(password)

    new_user = User(
        user_name=user_name,
        user_email=user_email,
        password=hashed_password,
        user_id=user_id
    )

    inserted_id = add_to_collection(db, schema_to_collection(User), new_user)
    if inserted_id: 
        return message
    else:
        return None
    

def get_user(db, user_id: str):
    """Retrieve a user by user_id from the database"""
    if not user_id:
        print("❌ User ID must not be empty.")
        return None
    
    try:
        user = fetch_collection_by_id_one(db, schema_to_collection(User), "user_id", user_id)
        if user:
            return user
        else:
            print("❌ User not found.")
            return None
    except Exception as e:
        print(f"Error retrieving user: {e}")
        return None


# ===== Raw User Interaction Functions =====

def save_user_interaction_raw(db, user_id: str, prompt: str, answer: str, metadata: Optional[Dict] = None):
    """Save a raw user interaction to the database"""
    new_interaction = UserInteractionRaw(
        user_id=user_id,
        prompt=prompt,
        answer=answer,
        metadata=metadata
    )
    
    inserted_id = add_to_collection(db, schema_to_collection(UserInteractionRaw), new_interaction)
    return inserted_id


def save_user_interaction_raw_many(db, user_id: str, prompts: list, answers: list, metadata: Optional[Dict] = None):
    """Save multiple raw user interactions to the database"""
    final_list = []
    for prompt, answer in zip(prompts, answers):
        new_interaction = UserInteractionRaw(
            user_id=user_id,
            prompt=prompt,
            answer=answer,
            metadata=metadata
        )
        final_list.append(new_interaction)
    
    inserted_id = add_to_collection_many(db, schema_to_collection(UserInteractionRaw), final_list)
    return inserted_id


def get_user_interactions_raw(db, user_id: str, limit: int):
    """Retrieve raw user interactions for a given user with limit"""
    try:
        convs = fetch_collection_sorted_by_id(db, schema_to_collection(UserInteractionRaw), "user_id", user_id, "timestamp", limit)
        return convs
    except Exception as e:
        print(f"Error retrieving user interactions raw: {e}")
        return []


def get_user_interactions_by_timeframe(db, user_id: str, start_time: str, end_time: str) -> List[Dict]:
    """Get user interactions within a specific timeframe"""
    try:
        interactions = list(db['ai_raw'].find({
            "user_id": user_id,
            "metadata.created_at": {
                "$gte": start_time,
                "$lte": end_time
            }
        }))
        return interactions
    except Exception as e:
        print(f"Error retrieving user interactions by timeframe: {e}")
        return []


def delete_all_user_interactions_raw(db):
    """Delete all raw user interactions"""
    try:
        deleted_count = delete_all_from_collection(
            db,
            schema_to_collection(UserInteractionRaw)
        )
        return deleted_count
    except Exception as e:
        print(f"Error deleting all user interactions raw: {e}")
        return 0


def delete_all_user_interactions_raw_by_id(db, user_id: str):
    """Delete all raw user interactions for a specific user"""
    try:
        deleted_count = delete_all_from_collection_by_id(
            db,
            schema_to_collection(UserInteractionRaw),
            "user_id",
            user_id
        )
        return deleted_count
    except Exception as e:
        print(f"Error deleting all user interactions raw by user ID: {e}")
        return 0


def delete_user_interaction_raw_by_id(db, user_id: str):
    """Delete a single raw user interaction for a specific user"""
    try:
        deleted_count = delete_one_from_collection_by_id(
            db,
            schema_to_collection(UserInteractionRaw),
            "user_id",
            user_id
        )
        return deleted_count
    except Exception as e:
        print(f"Error deleting user interaction raw by ID: {e}")
        return 0


# ===== User Interaction Summary Functions =====

def save_user_interaction_summary(db, user_id: str, summary: str, metadata: Optional[Dict] = None):
    """Save a summarized user interaction to the database"""
    new_interaction_summary = UserInteractionSummary(
        user_id=user_id,
        summary=summary,
        metadata=metadata
    )

    inserted_id = add_to_collection(db, schema_to_collection(UserInteractionSummary), new_interaction_summary)
    return inserted_id


def save_user_interaction_summary_many(db, user_id: str, summaries: list, metadata: Optional[Dict] = None):
    """Save multiple summarized user interactions to the database"""
    final_summaries = []
    for summary in summaries:
        new_interaction_summary = UserInteractionSummary(
            user_id=user_id,
            summary=summary,
            metadata=metadata
        )
        final_summaries.append(new_interaction_summary)

    inserted_id = add_to_collection_many(db, schema_to_collection(UserInteractionSummary), final_summaries)
    return inserted_id


def get_user_interactions_summary(db, user_id: str, limit: int):
    """Retrieve user interaction summaries for a given user with limit"""
    try:
        summaries = fetch_collection_sorted_by_id(db, schema_to_collection(UserInteractionSummary), "user_id", user_id, "timestamp", limit)
        return summaries
    except Exception as e:
        print(f"Error retrieving user interactions summaries: {e}")
        return []


def delete_all_user_interactions_summary(db):
    """Delete all user interaction summaries"""
    try:
        deleted_count = delete_all_from_collection(
            db,
            schema_to_collection(UserInteractionSummary)
        )
        return deleted_count
    except Exception as e:
        print(f"Error deleting all user interactions summaries: {e}")
        return 0


def delete_all_user_interactions_summary_by_id(db, user_id: str):
    """Delete all user interaction summaries for a specific user"""
    try:
        deleted_count = delete_all_from_collection_by_id(
            db,
            schema_to_collection(UserInteractionSummary),
            "user_id",
            user_id
        )
        return deleted_count
    except Exception as e:
        print(f"Error deleting all user interactions summaries by user ID: {e}")
        return 0


def delete_user_interaction_summary_by_id(db, user_id: str):
    """Delete a single user interaction summary for a specific user"""
    try:
        deleted_count = delete_one_from_collection_by_id(
            db,
            schema_to_collection(UserInteractionSummary),
            "user_id",
            user_id
        )
        return deleted_count
    except Exception as e:
        print(f"Error deleting user interaction summary by ID: {e}")
        return 0


def save_user_daily_summary(db, user_id: str, summary: str, metadata: Optional[Dict] = None) -> str:
    """Save a daily summary of user interactions"""
    try:
        data = {
            "user_id": user_id,
            "summary": summary,
            "metadata": metadata or {}
        }
            
        result = db['ai_summary'].insert_one(data)
        return str(result.inserted_id)
    except Exception as e:
        print(f"Error saving daily summary: {e}")
        return None


def get_latest_daily_summary(db, user_id: str) -> Optional[Dict]:
    """Get the most recent daily summary for a user"""
    try:
        summary = db['ai_summary'].find_one(
            {"user_id": user_id},
            sort=[("metadata.created_at", -1)]
        )
        return summary
    except Exception as e:
        print(f"Error retrieving daily summary: {e}")
        return None


def get_user_daily_summaries(db, user_id: str, limit: Optional[int] = None) -> List[Dict]:
    """Get daily summaries for a user"""
    try:
        query = {"user_id": user_id}
        
        if limit:
            summaries = list(db['ai_summary'].find(query).sort("metadata.created_at", -1).limit(limit))
        else:
            summaries = list(db['ai_summary'].find(query).sort("metadata.created_at", -1))
            
        return summaries
    except Exception as e:
        print(f"Error retrieving user daily summaries: {e}")
        return []


# ===== Blog Functions =====

def save_blog(db, blog: Blog):
    """Save a blog to the database"""
    try:
        inserted_id = add_to_collection(db, schema_to_collection(Blog), blog)
        return inserted_id
    except Exception as e:
        print(f"Error saving blog: {e}")
        return None


def get_blogs(db, keyword, limit: int):
    """Retrieve blogs from the database by keyword with limit"""
    try:
        blogs = fetch_collection_by_id_list_all(db, schema_to_collection(Blog), "keywords", keyword, limit)
        if len(blogs) < limit:
            more_blogs = fetch_many_from_collection(db, schema_to_collection(Blog), {}, limit-len(blogs))
            blogs.extend(more_blogs)
        return blogs
    except Exception as e:
        print(f"Error retrieving blogs: {e}")
        return []


# ===== User Profile Functions =====

def get_user_profile(db, user_id: str) -> Optional[Dict]:
    """Get a user's profile from the database"""
    try:
        profile = db['user_profiles'].find_one({"user_id": user_id})
        if profile and "_id" in profile:
            del profile["_id"]  # Remove MongoDB ObjectId
        return profile
    except Exception as e:
        print(f"Error retrieving user profile: {e}")
        return None


def create_user_profile(db, user_id: str, age: Optional[int], stage: Optional[str], 
                        symptoms: List[str], treatments: List[str] = None) -> bool:
    """Create a new user profile"""
    try:
        profile = {
            "user_id": user_id,
            "age": age,
            "menopause_stage": stage,
            "reported_symptoms": symptoms if symptoms else [],
            "treatments": treatments if treatments else [],
            "preferences": {},
            "created_at": datetime.now(pytz.UTC).isoformat(),
            "last_updated": datetime.now(pytz.UTC).isoformat()
        }
        
        db['user_profiles'].insert_one(profile)
        return True
    except Exception as e:
        print(f"Error creating user profile: {e}")
        return False


def update_user_profile_with_info(db, user_id: str, info: Dict[str, Any]) -> bool:
    """Update user profile with extracted information"""
    try:
        profile = get_user_profile(db, user_id)
        
        if not profile:
            return False
            
        updates = {}
        
        # Only update age if not already set
        if not profile.get("age") and info.get("age"):
            updates["age"] = info["age"]
        
        # Only update stage if not already set or if changing from perimenopause to menopause
        current_stage = profile.get("menopause_stage")
        new_stage = info.get("stage")
        if new_stage and (not current_stage or 
                         (current_stage == "perimenopause" and new_stage == "menopause") or
                         (current_stage == "menopause" and new_stage == "postmenopause")):
            updates["menopause_stage"] = new_stage
        
        # Add new symptoms without duplicates
        current_symptoms = set(profile.get("reported_symptoms", []))
        new_symptoms = set(info.get("symptoms", []))
        if new_symptoms - current_symptoms:  # If there are new symptoms
            updates["reported_symptoms"] = list(current_symptoms.union(new_symptoms))
        
        # Add new treatments without duplicates
        current_treatments = set(profile.get("treatments", []))
        new_treatments = set(info.get("treatments", []))
        if new_treatments - current_treatments:  # If there are new treatments
            updates["treatments"] = list(current_treatments.union(new_treatments))
        
        # Update timestamp
        updates["last_updated"] = datetime.now(pytz.UTC).isoformat()
        
        # Only update if we have changes
        if updates:
            db['user_profiles'].update_one(
                {"user_id": user_id},
                {"$set": updates}
            )
            
        return True
    except Exception as e:
        print(f"Error updating user profile: {e}")
        return False


def delete_user(db, user_id: str):
    """Delete a user from the database"""
    try:
        deleted_count = delete_one_from_collection_by_id(
            db,
            schema_to_collection(User),
            "user_id",
            user_id
        )
        return deleted_count
    except Exception as e:
        print(f"Error deleting user: {e}")
        return 0


def delete_all_users(db):
    """Delete all users from the database"""
    try:
        deleted_count = delete_all_from_collection(
            db,
            schema_to_collection(User)
        )
        return deleted_count
    except Exception as e:
        print(f"Error deleting all users: {e}")
        return 0


# ===== User Embedding Functions =====

def save_user_embedding(db, user_id: str, embedding: List[float], summary: str, 
                       raw_id: Optional[str] = None, metadata: Optional[Dict] = None) -> str:
    """Save a user conversation embedding"""
    try:
        data = {
            "user_id": user_id,
            "embedding": embedding,
            "summary": summary,
            "metadata": metadata or {}
        }
        
        if raw_id:
            data["raw_id"] = raw_id
            
        result = db['ai_embeddings'].insert_one(data)
        return str(result.inserted_id)
    except Exception as e:
        print(f"Error saving user embedding: {e}")
        return None


def get_user_embeddings(db, user_id: str, limit: Optional[int] = None) -> List[Dict]:
    """Get all embeddings for a user"""
    try:
        query = {"user_id": user_id}
        
        if limit:
            embeddings = list(db['ai_embeddings'].find(query).limit(limit))
        else:
            embeddings = list(db['ai_embeddings'].find(query))
            
        return embeddings
    except Exception as e:
        print(f"Error retrieving user embeddings: {e}")
        return []


def get_user_embeddings_by_type(db, user_id: str, summary_type: str) -> List[Dict]:
    """Get embeddings of a specific type for a user"""
    try:
        query = {
            "user_id": user_id,
            "metadata.summary_type": summary_type
        }
        
        embeddings = list(db['ai_embeddings'].find(query))
        return embeddings
    except Exception as e:
        print(f"Error retrieving user embeddings by type: {e}")
        return []


# ===== Symptom Tracking Functions =====

def log_symptom(db, user_id: str, symptom_date: date, symptom: str, severity: int) -> bool:
    """Log a symptom entry for a user"""
    try:
        # Validate symptom type
        if symptom.lower() not in SYMPTOM_TYPES:
            print(f"Invalid symptom type: {symptom}")
            return False
            
        # Format date as string
        date_str = symptom_date.isoformat()
        
        # Check if we already have entries for this date
        existing = db['symptoms'].find_one({
            "user_id": user_id,
            "date": date_str
        })

        if existing:
            # Update existing entry
            symptom_exists = False
            updated_symptoms = existing.get("symptoms", [])
            
            # Check if this symptom already exists for today
            for s in updated_symptoms:
                if s.get("name") == symptom.lower():
                    s["severity"] = severity
                    symptom_exists = True
                    break
                    
            # Add new symptom if it doesn't exist
            if not symptom_exists:
                updated_symptoms.append({
                    "name": symptom.lower(),
                    "severity": severity
                })
                
            # Update the document
            db['symptoms'].update_one(
                {"user_id": user_id, "date": date_str},
                {"$set": {"symptoms": updated_symptoms}}
            )
        else:
            # Create a new entry
            db['symptoms'].insert_one({
                "user_id": user_id,
                "date": date_str,
                "symptoms": [{
                    "name": symptom.lower(),
                    "severity": severity
                }]
            })
            
        return True
    except Exception as e:
        print(f"Error logging symptom: {e}")
        return False


def get_weekly_symptoms(db, user_id: str, start_date: date) -> Dict[str, Any]:
    """Get all symptoms logged for a user in a specific week"""
    try:
        # Calculate the end date (7 days after start)
        end_date = start_date + timedelta(days=7)
        
        # Query for symptoms within the date range
        query = {
            "user_id": user_id,
            "date": {
                "$gte": start_date.isoformat(),
                "$lt": end_date.isoformat()
            }
        }
        
        # Get all symptom logs in the date range
        symptom_logs = list(db['symptoms'].find(query).sort("date", 1))
        
        # Initialize result structure with empty days
        result = {
            "user_id": user_id,
            "week_start": start_date,
            "symptoms": []
        }
        
        # Create a dictionary for the week (date -> symptoms)
        week_dict = {}
        current_date = start_date
        
        # Initialize all 7 days of the week with empty symptom lists
        for i in range(7):
            day = current_date + timedelta(days=i)
            week_dict[day.isoformat()] = []
        
        # Populate with actual symptom data
        for log in symptom_logs:
            day = log.get("date")
            if day in week_dict:
                week_dict[day] = log.get("symptoms", [])
        
        # Convert to the response format
        for i in range(7):
            day = (start_date + timedelta(days=i)).isoformat()
            result["symptoms"].append({
                "date": day,
                "symptoms": week_dict.get(day, [])
            })
            
        return result
    except Exception as e:
        print(f"Error getting weekly symptoms: {e}")
        return {"user_id": user_id, "week_start": start_date, "symptoms": []}


def extract_symptoms_from_text(text: str) -> List[Dict[str, Any]]:
    """Extract potential symptoms and their severity from text"""
    found_symptoms = []
    text = text.lower()
    
    # Map for severity words to numbers
    severity_map = {
        "mild": 1,
        "slight": 1,
        "minimal": 1,
        "moderate": 2,
        "somewhat": 2,
        "noticeable": 2,
        "significant": 3,
        "considerable": 3,
        "strong": 4,
        "severe": 4,
        "extreme": 5,
        "unbearable": 5,
        "worst": 5
    }
    
    # Check for each symptom type
    for symptom in SYMPTOM_TYPES:
        if symptom in text:
            # Default severity is 3 (moderate)
            severity = 3
            
            # Look for severity indicators
            for severity_word, severity_value in severity_map.items():
                if severity_word + " " + symptom in text:
                    severity = severity_value
                    break
                    
            found_symptoms.append({
                "name": symptom,
                "severity": severity
            })
            
    return found_symptoms