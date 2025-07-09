import sys
import os
import uuid
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from rag.rag_with_memory import MedicalRAGPipelineWithMemory
from database.db_dao import create_user_profile, get_user_profile, setup_database_indexes
import chainlit as cl
from datetime import datetime, timedelta  # Added timedelta import
from database.db_dao import *
from database.db import get_mongo_database
from agents.recommend import RecommendationAgent
from agents.emotional_agent import EmotionalBot
from agents.appointment import AppointmentAgent

# Get database and ensure it's set up properly
db = get_mongo_database()
setup_database_indexes(db)

# Initialize the optimized model
model = MedicalRAGPipelineWithMemory(db)
# recommend_agent = RecommendationAgent(db)
# emotional_agent = EmotionalBot()
appointment_agent = AppointmentAgent()

def generate_user_id():
    return str(uuid.uuid4())

@cl.on_chat_start
async def on_chat_start():
    # Create a new session when a user starts chatting
    user_id = cl.user_session.get("user_id")
    
    if not user_id:
        user_id = "test_user"
        cl.user_session.set("user_id", user_id)
        
        # Check if user profile exists, if not create a basic one
        profile = get_user_profile(db, user_id)
        if not profile:
            # Create a basic profile for testing
            create_user_profile(
                db,
                user_id=user_id,
                age=None,  # Unknown age
                stage=None,  # Unknown stage
                symptoms=[]  # No symptoms yet
            )
    
    await cl.Message(
        content="Hello! I'm MenopauseBot. How can I help you today?\n\n(For better personalization, please share your age, menopause stage, and any symptoms you're experiencing)",
        author="MenopauseBot"
    ).send()

@cl.on_message
async def on_message(message: cl.Message):
    user_id = cl.user_session.get("user_id")
    if not user_id:
        await cl.Message(
            content="Session expired or invalid. Please start a new chat.",
            author="MenopauseBot"
        ).send()
        return
    
    # Show "typing" indicator
    await cl.Message(content="", author="MenopauseBot").send()

    try:
        if message.content.startswith("/appointment"):
            result = await appointment_agent.create_appointment(message.content)
            if isinstance(result, dict):
                await cl.Message(
                    content=f"I've added your appointment to your calendar! {result['link']}",
                    author="MenopauseBot"
                ).send()
            else:
                # If result is a string, it's an error message
                await cl.Message(
                    content=result,
                    author="MenopauseBot"
                ).send()
        elif message.content.startswith('/find-doctor'):
            stripped_query = message.content.replace('/find-doctor', '').strip()

            doctor_list = [
                {"name": "Dr. Jane Smith", "specialty": "Gynecology", "location": "215 Downtown Pittsburgh", "Availability": "10AM - 2PM, 4PM - 6PM", "Rating": "4.5", "Days":"Monday, Wednesday, Friday"},
                {"name": "Dr. Emily Johnson", "specialty": "Gynecology", "location": "5714 Beacon Street", "Availability": "11AM - 3PM, 5PM - 7PM", "Rating": "4.7", "Days":"Tuesday, Thursday"},
                {"name": "Dr. Sarah Brown", "specialty": "Gynecology", "location": "613 Ellsworth Street", "Availability": "9AM - 1PM, 3PM - 5PM", "Rating": "4.1", "Days" :"Monday, Wednesday, Thursday"},
            ]
            result = {
                "response": f"Here are the top 3 doctors specializing in {stripped_query} in your area:",
                "doctor_list": doctor_list
            }
            await cl.Message(
                content=result,
                author="MenopauseBot"
            ).send()
        else:
            result = await model.query_with_memory(
                query=message.content,
                user_id=user_id,
            )
            
            # Send the response
            await cl.Message(
                content=result["answer"],
                author="MenopauseBot"
            ).send()
        # Use the optimized model to process the query
        result = await model.query_with_memory(
            query=message.content,
            user_id=user_id,
        )
        
        # Send the response as a new message (fixed the update() error)
        await cl.Message(
            content=result["answer"],
            author="MenopauseBot"
        ).send()
        
        # Check if we have source citations to display
        if result.get("citations") and len(result.get("citations", {})) > 0:
            sources_text = "**Sources:**\n"
            for i, (source, details) in enumerate(result.get("citations", {}).items(), 1):
                sources_text += f"{i}. {source}\n"
            
            # Add sources as a separate message
            await cl.Message(
                content=sources_text,
                author="MenopauseBot"
            ).send()
        
    except Exception as e:
        # Handle errors gracefully
        await cl.Message(
            content=f"I'm sorry, I encountered an error: {str(e)}",
            author="MenopauseBot"
        ).send()

# @cl.on_message
# async def on_message(message: cl.Message):
#     user_id = cl.user_session.get("user_id")
#     if not user_id:
#         await cl.Message(
#             content="Session expired or invalid. Please start a new chat.",
#             author="MenopauseBot"
#         ).send()
#         return
#     await cl.Message(content="", author="MenopauseBot").send() 
#     result = await emotional_agent.chat(message.content)
#     session_id = result["session_id"]
#     # if "analyzed_data" in result:
#     #     print(f"Sentiment analysis: {result['analyzed_data']['sentiment']}")
#     await cl.Message(
#         content=result["response"],
#         author="Maya"
#     ).send()

@cl.on_settings_update
async def setup_agent(settings):
    # This function can be used to update user profile settings
    # if they are changed through the Chainlit interface
    user_id = cl.user_session.get("user_id")
    
    if user_id and settings:
        try:
            profile_updates = {}
            
            # Check for menopause-related settings
            if "age" in settings and settings["age"]:
                profile_updates["age"] = int(settings["age"])
                
            if "menopause_stage" in settings and settings["menopause_stage"]:
                profile_updates["menopause_stage"] = settings["menopause_stage"]
                
            if "symptoms" in settings and settings["symptoms"]:
                # Symptoms might be comma-separated
                symptoms = [s.strip() for s in settings["symptoms"].split(",")]
                profile_updates["reported_symptoms"] = symptoms
            
            # Update the profile if we have changes
            if profile_updates:
                db['user_profiles'].update_one(
                    {"user_id": user_id},
                    {"$set": profile_updates},
                    upsert=True
                )
                
                await cl.Message(
                    content="Your profile has been updated. This helps me provide more personalized information.",
                    author="MenopauseBot"
                ).send()
                
        except Exception as e:
            await cl.Message(
                content=f"I couldn't update your profile settings: {str(e)}",
                author="MenopauseBot"
            ).send()
