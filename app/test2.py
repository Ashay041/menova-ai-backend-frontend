import asyncio
import sys

import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from rag.rag_with_memory import MedicalRAGPipelineWithMemory

from database.db import get_mongo_database


db = get_mongo_database()
bot = MedicalRAGPipelineWithMemory(db)

async def simple_chat():
    # Initialize the bot (adjust parameters if needed)
    user_id = "simple_user"
    conversation_id = "simple_conversation"
    
    print("Simple Menopause Bot Chat")
    print("Type 'exit' to quit")
    
    while True:
        # Get user input
        user_input = input("\nYou: ")
        
        # Check for exit command
        if user_input.lower() == 'exit':
            print("Goodbye!")
            break
        
        try:
            # Query the bot
            result = await bot.query_with_memory(
                query=user_input,
                user_id=user_id,
                conversation_id=conversation_id
            )
            
            # Display the response
            print(f"\nBot: {result['answer']}")
            
        except Exception as e:
            print(f"Error: {str(e)}")

# Run the main function
if __name__ == "__main__":
    asyncio.run(simple_chat())