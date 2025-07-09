import uuid
import time
import asyncio
import os
import atexit
from typing import Dict, Optional, List

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationChain
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from dotenv import load_dotenv


class EmotionalSupportAgent:
    def __init__(
        self,
        llm_model: str = "gemini-1.5-pro",
        temperature: float = 0.8,
        max_history: int = 10,
        session_timeout: int = 3600,  # 1 hour
        persona: str = "maya"
    ):
        load_dotenv()
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable not found")
        self.llm = ChatGoogleGenerativeAI(
            model=llm_model,
            temperature=temperature,
            google_api_key=gemini_api_key
        )
        self.max_history = max_history
        self.session_timeout = session_timeout
        self.sessions: Dict[str, dict] = {}
        self.personas = self._init_personas()
        self.current_persona = persona

        # Initialize the system prompt
        self._set_prompt(self.current_persona)

        # Optional cleanup on exit
        atexit.register(self._cleanup_all_sessions)

    def _init_personas(self) -> Dict[str, str]:
        return {
            "maya": (
                "You are Maya, a warm and compassionate assistant helping women through emotional, hormonal, "
                "or lifestyle changes during menopause. You always respond with empathy, kindness, and support. "
                "Avoid medical jargon or diagnoses. Remember that you are not a medical professional and should "
                "encourage users to consult healthcare providers for medical advice. Focus on emotional support, "
                "lifestyle suggestions, and creating a safe space for sharing. Always acknowledge feelings first "
                "before offering suggestions. Use a conversational, friendly tone. Share personal anecdotes when "
                "appropriate (as if you were a woman who has experienced menopause)."
            ),
            "coach": (
                "You are a supportive wellness coach helping people navigate health challenges. "
                "You provide encouragement, practical advice, and motivational support. "
                "You're direct but kind, focusing on empowering people to take small, achievable steps. "
                "You ask thoughtful follow-up questions and celebrate progress. You're not a medical professional "
                "and recommend consulting healthcare providers for medical advice. Use a motivating tone "
                "and speak in shorter, more direct sentences."
            ),
            "friend": (
                "You are a supportive friend having a casual conversation. You're warm, informal and use "
                "casual language. You share relatable thoughts and validate feelings. You ask questions "
                "that show you're truly listening. You're not providing professional advice, just friendly "
                "support. Use conversational language with occasional humor and empathy. Keep responses brief "
                "and text-message like."
            )
        }

    def _set_prompt(self, persona_key: str) -> None:
        persona_prompt = self.personas.get(persona_key, self.personas["maya"])
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", persona_prompt),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}")
        ])

    def _cleanup_expired_sessions(self) -> None:
        now = time.time()
        expired = [sid for sid, s in self.sessions.items() if now - s["last_active"] > self.session_timeout]
        for sid in expired:
            del self.sessions[sid]

    def _cleanup_all_sessions(self) -> None:
        self.sessions.clear()
        print("Cleaned all sessions on exit.")

    def _get_chain_for_session(self, session_id: str) -> ConversationChain:
        self._cleanup_expired_sessions()
        if session_id in self.sessions:
            self.sessions[session_id]["last_active"] = time.time()
            return self.sessions[session_id]["chain"]

        memory = ConversationBufferWindowMemory(k=self.max_history, return_messages=True)
        chain = ConversationChain(
            llm=self.llm,
            memory=memory,
            prompt=self.prompt,
            verbose=False
        )

        self.sessions[session_id] = {
            "chain": chain,
            "last_active": time.time()
        }

        return chain

    def create_session(self) -> str:
        return str(uuid.uuid4())

    def end_session(self, session_id: str) -> bool:
        return self.sessions.pop(session_id, None) is not None

    def change_persona(self, persona_key: str) -> bool:
        if persona_key not in self.personas:
            return False
        self.current_persona = persona_key
        self._set_prompt(persona_key)
        return True


    def add_conversation_context(self, session_id: str, context: str) -> bool:
        if session_id not in self.sessions:
            return False
        memory = self.sessions[session_id]["chain"].memory
        memory.chat_memory.add_ai_message(f"[SYSTEM NOTE: {context}]")
        return True

    async def chat(self, query: str, session_id: Optional[str] = None, sentiment_analysis: bool = False) -> dict:
        if not session_id:
            session_id = self.create_session()

        chain = self._get_chain_for_session(session_id)

        analyzed_data = {}
        if sentiment_analysis:
            sentiment_score = sum([
                -1 if word in query.lower() else 0 for word in ["sad", "angry", "anxious", "worried", "frustrated", "depressed"]
            ]) + sum([
                1 if word in query.lower() else 0 for word in ["happy", "grateful", "excited", "hopeful", "calm", "relaxed"]
            ])
            category = "positive" if sentiment_score > 0 else "negative" if sentiment_score < 0 else "neutral"
            analyzed_data["sentiment"] = {"score": sentiment_score, "category": category}

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: chain.invoke(query))

        return {
            "response": response,
            "session_id": session_id,
            "analyzed_data": analyzed_data if sentiment_analysis else None
        }

    def get_active_sessions_count(self) -> int:
        self._cleanup_expired_sessions()
        return len(self.sessions)



# Example usage:
async def main():
    bot = EmotionalSupportAgent(streaming=False)  # Disable streaming for cleaner output in this example
    
    response1 = await bot.chat("I've been feeling anxious about my hormone changes", sentiment_analysis=True)
    session_id = response1["session_id"]
    print(f"Session ID: {session_id}")
    print(f"Bot: {response1['response']}")
    if "analyzed_data" in response1:
        print(f"Sentiment analysis: {response1['analyzed_data']['sentiment']}")
    
    # Add some context to the conversation
    bot.add_conversation_context(session_id, "User has mentioned sleep issues in previous conversations")
    
    response2 = await bot.chat("What can I do about hot flashes?", session_id)
    print(f"Bot: {response2['response']}")
    
    bot.end_session(session_id)
    print(f"Session ended: {session_id}")
    

# if __name__ == "__main__":
#     asyncio.run(main())