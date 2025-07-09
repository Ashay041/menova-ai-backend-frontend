from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import pytz
from langchain.memory import ConversationBufferWindowMemory
from langchain_community.embeddings import HuggingFaceEmbeddings
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words
import re

import json

class ConversationManager:
    def __init__(self, db_dao, recent_turns=3, max_short_term=5, token_limit=1500):
        self.db_dao = db_dao
        self.recent_turns = recent_turns
        self.max_short_term = max_short_term
        self.token_limit = token_limit
        self.user_memories = {}
        self.embeddings = HuggingFaceEmbeddings(
            model_name="pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb"
        )
    
    def _get_user_memory(self, user_id: str) -> ConversationBufferWindowMemory:
        """Get or create a short-term memory buffer for the user"""
        if user_id not in self.user_memories:
            self.user_memories[user_id] = ConversationBufferWindowMemory(
                k=self.max_short_term, 
                return_messages=True
            )
        return self.user_memories[user_id]
    
    def _generate_mini_summary(self, text: str) -> str:
        """Generate a concise summary of text"""
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        stemmer = Stemmer("english")
        summarizer = LsaSummarizer(stemmer)
        summarizer.stop_words = get_stop_words("english")
        summary_sentences = summarizer(parser.document, 2)
        return " ".join([str(sentence) for sentence in summary_sentences])
    
    def _generate_enhanced_summary(self, text: str) -> str:
        """Generate a more detailed summary for medium-term memory"""
        # Extract user specific information patterns
        user_info = self._extract_user_info(text)
        
        # Generate standard summary
        standard_summary = self._generate_mini_summary(text)
        
        # Create enhanced summary with more details
        enhanced_summary = standard_summary
        
        # Add extracted information
        if user_info.get("age"):
            enhanced_summary += f" User is {user_info['age']} years old."
        
        if user_info.get("stage"):
            enhanced_summary += f" User is in {user_info['stage']}."
        
        if user_info.get("symptoms"):
            enhanced_summary += f" Reports symptoms: {', '.join(user_info['symptoms'][:5])}."
        
        if user_info.get("treatments"):
            enhanced_summary += f" Has tried: {', '.join(user_info['treatments'][:3])}."
        
        return enhanced_summary
    
    def _generate_comprehensive_summary(self, text: str) -> str:
        """Generate a more comprehensive summary for daily summaries"""
        # Use a more detailed summarization approach for daily summaries
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        stemmer = Stemmer("english")
        summarizer = LsaSummarizer(stemmer)
        summarizer.stop_words = get_stop_words("english")
        
        # Generate more summary sentences for daily summaries
        summary_sentences = summarizer(parser.document, 5)
        basic_summary = " ".join([str(sentence) for sentence in summary_sentences])
        
        # Extract user information
        user_info = self._extract_user_info(text)
        
        # Create enhanced summary with key information
        enhanced_summary = f"Daily Summary: {basic_summary}"
        
        if user_info.get("age"):
            enhanced_summary += f" User age: {user_info['age']}."
        
        if user_info.get("stage"):
            enhanced_summary += f" Menopause stage: {user_info['stage']}."
        
        if user_info.get("symptoms"):
            enhanced_summary += f" Reported symptoms: {', '.join(user_info['symptoms'][:7])}."
        
        if user_info.get("treatments"):
            enhanced_summary += f" Mentioned treatments: {', '.join(user_info['treatments'][:5])}."
        
        return enhanced_summary
    
    def _extract_user_info(self, text: str) -> Dict[str, Any]:
        """Extract structured user information from text"""
        info = {
            "age": None,
            "stage": None,
            "symptoms": [],
            "treatments": []
        }
        
        # Extract age
        age_match = re.search(r"(?:I am|I'm) (\d+) years old", text, re.IGNORECASE)
        if age_match and age_match.group(1).isdigit():
            info["age"] = int(age_match.group(1))
        
        # Extract menopause stage
        stage_patterns = {
            "perimenopause": r"(?:I am|I'm) (?:in|experiencing) peri[-]?menopaus[e|al]",
            "menopause": r"(?:I am|I'm) (?:in|experiencing) menopaus[e|al]",
            "postmenopause": r"(?:I am|I'm) (?:in|experiencing) post[-]?menopaus[e|al]"
        }
        
        for stage, pattern in stage_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                info["stage"] = stage
                break
        
        # Extract symptoms
        symptom_patterns = [
            "hot flash(es)?", "night sweat(s)?", "mood swings?", 
            "irregular periods?", "vaginal dryness", "sleep (issues|problems)",
            "memory (issues|problems|fog)", "brain fog", "fatigue", 
            "joint pain", "low libido", "weight gain", "anxiety", "depression"
        ]
        
        for symptom in symptom_patterns:
            if re.search(rf"\b{symptom}\b", text, re.IGNORECASE):
                # Extract the base form of the symptom
                base_match = re.match(r"([a-z ]+)(?:\(.*?\))?(?:\w+\?)?", symptom)
                if base_match:
                    base_symptom = base_match.group(1).strip()
                    info["symptoms"].append(base_symptom)
        
        # Extract treatments
        treatment_patterns = [
            "HRT", "hormone replacement therapy", "estrogen", "progesterone",
            "antidepressants?", "gabapentin", "clonidine", "SSRIs?", 
            "black cohosh", "evening primrose oil", "meditation", "acupuncture"
        ]
        
        for treatment in treatment_patterns:
            if re.search(rf"\b{treatment}\b", text, re.IGNORECASE):
                # FIX: Safely extract the base form of the treatment
                # The bug was here - we need to check if the match exists before accessing group(1)
                base_match = re.match(r"([a-z ]+)(?:\(.*?\))?(?:\w+\?)?", treatment)
                if base_match:
                    base_treatment = base_match.group(1).strip()
                    info["treatments"].append(base_treatment)
                else:
                    # For cases like "HRT" that don't match the pattern but are still valid
                    info["treatments"].append(treatment)
        
        return info
    
    def _is_different_day(self, timestamp_str, now):
        """Check if timestamp is from a different day than now"""
        if not timestamp_str:
            return True
            
        try:
            timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            return (timestamp.year != now.year or 
                    timestamp.month != now.month or 
                    timestamp.day != now.day)
        except:
            return True
    
    def prepare_context_for_llm(self, user_id: str, current_query: str) -> Dict[str, Any]:
        """Prepare optimized context for the LLM using three-tier memory"""
        # 1. Get user profile (highest priority)
        user_profile = self.db_dao.get_user_profile(user_id)
        if not user_profile:
            user_profile = {}
        
        # 2. Get recent raw conversations (highest recency value)
        recent_msgs = self.db_dao.get_user_interactions_raw(user_id, limit=3)
        
        # 3. Get relevant medium-term summaries
        query_embedding = self.embeddings.embed_query(current_query)
        medium_term_memory = self._retrieve_relevant_medium_term_memory(user_id, query_embedding, top_k=2)
        
        # 4. Get relevant daily summaries
        daily_summaries = self._retrieve_relevant_daily_summaries(user_id, query_embedding, top_k=1)
        
        # Assemble context
        context = {
            "user_profile": user_profile,
            "recent_conversation": recent_msgs,
            "medium_term_memory": medium_term_memory,
            "daily_summaries": daily_summaries
        }
        
        return context
    
    def _retrieve_relevant_medium_term_memory(self, user_id, query_embedding, top_k=2):
        """Retrieve relevant medium-term memory summaries"""
        embeddings = self.db_dao.get_user_embeddings_by_type(
            user_id, summary_type="medium_term"
        )
        
        return self._get_similar_embeddings(embeddings, query_embedding, top_k)
    
    def _retrieve_relevant_daily_summaries(self, user_id, query_embedding, top_k=1):
        """Retrieve relevant daily summaries"""
        # Convert daily summaries to embeddings first
        daily_summaries = self.db_dao.get_user_daily_summaries(user_id, limit=7)  # Last week
        
        if not daily_summaries:
            return []
        
        # Create embeddings for the summaries
        summary_embeddings = []
        for i, summary in enumerate(daily_summaries):
            summary_text = summary.get("summary", "")
            if summary_text:
                embedding = self.embeddings.embed_query(summary_text)
                summary_embeddings.append({
                    "index": i,
                    "embedding": embedding,
                    "summary": summary_text,
                    "created_at": summary.get("metadata", {}).get("created_at", "")
                })
        
        return self._get_similar_embeddings(summary_embeddings, query_embedding, top_k)
    
    def _get_similar_embeddings(self, embeddings, query_embedding, top_k):
        """Get embeddings similar to the query embedding"""
        if not embeddings:
            return []
        
        # Calculate similarities
        similarities = []
        for i, doc in enumerate(embeddings):
            emb = doc.get("embedding", [])
            if emb:
                # Reshape to vectors
                q_emb = np.array(query_embedding).reshape(1, -1)
                doc_emb = np.array(emb).reshape(1, -1)
                
                # Calculate similarity
                similarity = np.dot(q_emb, doc_emb.T)[0][0] / (
                    np.linalg.norm(q_emb) * np.linalg.norm(doc_emb)
                )
                similarities.append((similarity, i))
        
        # Sort by similarity (descending)
        similarities.sort(reverse=True)
        
        # Get top-k most similar items
        top_results = []
        for sim, idx in similarities[:top_k]:
            if sim > 0.4:  # Only include if similarity is above threshold
                top_results.append({
                    "summary": embeddings[idx].get("summary", ""),
                    "similarity": float(sim),
                    "created_at": embeddings[idx].get("created_at", "")
                })
        
        return top_results
    
    def _format_profile_for_context(self, profile: Dict) -> Dict:
        """Format user profile for inclusion in the context"""
        formatted = {}
        
        if profile.get("age"):
            formatted["age"] = profile["age"]
        
        if profile.get("menopause_stage"):
            formatted["stage"] = profile["menopause_stage"]
        
        if profile.get("reported_symptoms"):
            formatted["symptoms"] = profile["reported_symptoms"]
        
        if profile.get("treatments"):
            formatted["treatments"] = profile["treatments"]
        
        return formatted
    
    def create_optimized_prompt(self, current_query: str, context: Dict, max_tokens: int = 1500) -> str:
        """Create a token-optimized prompt with context"""
        # Roughly estimate tokens (chars/4 is a common approximation)
        tokens_per_char = 0.25
        
        # Reserve tokens for query and response
        query_tokens = len(current_query) * tokens_per_char
        reserved_tokens = query_tokens + 200  # Reserve space for response
        
        available_tokens = max_tokens - reserved_tokens
        current_tokens = 0
        final_context_parts = []
        
        # 1. First priority: User profile
        profile = context.get("user_profile", {})
        formatted_profile = self._format_profile_for_context(profile)
        
        if formatted_profile:
            profile_text = f"USER PROFILE: {json.dumps(formatted_profile)}"
            profile_tokens = len(profile_text) * tokens_per_char
            
            if profile_tokens <= available_tokens:
                final_context_parts.append(profile_text)
                current_tokens += profile_tokens
                available_tokens -= profile_tokens
        
        # 2. Second priority: Recent conversations
        for msg in context.get("recent_conversation", []):
            msg_text = f"User: {msg.get('prompt', '')}\nAssistant: {msg.get('answer', '')}"
            msg_tokens = len(msg_text) * tokens_per_char
            
            if current_tokens + msg_tokens <= available_tokens:
                final_context_parts.append(msg_text)
                current_tokens += msg_tokens
                available_tokens -= msg_tokens
            else:
                break
        
        # 3. Third priority: Medium-term memory
        for memory in context.get("medium_term_memory", []):
            mem_text = f"RECENT SUMMARY: {memory.get('summary', '')}"
            mem_tokens = len(mem_text) * tokens_per_char
            
            if current_tokens + mem_tokens <= available_tokens:
                final_context_parts.append(mem_text)
                current_tokens += mem_tokens
                available_tokens -= mem_tokens
            else:
                break
        
        # 4. Fourth priority: Daily summaries
        for summary in context.get("daily_summaries", []):
            sum_text = f"DAILY SUMMARY: {summary.get('summary', '')}"
            sum_tokens = len(sum_text) * tokens_per_char
            
            if current_tokens + sum_tokens <= available_tokens:
                final_context_parts.append(sum_text)
                current_tokens += sum_tokens
                available_tokens -= sum_tokens
            else:
                break
        
        # Assemble final context
        final_context = "\n\n".join(final_context_parts)
        return final_context
    
    def save_conversation(self, user_id: str, query: str, answer: str):
        """Save conversation with optimized memory management"""
        # 1. Set expiration for raw conversation (24 hours)
        now = datetime.now(pytz.UTC)
        expiration_date = now + timedelta(hours=24)
        
        # 2. Save raw conversation
        metadata = {
            "created_at": now.isoformat(),
            "expires_at": expiration_date.isoformat()
        }
        
        raw_result = self.db_dao.save_user_interaction_raw(
            user_id, query, answer, metadata
        )
        
        # 3. Update memory buffer
        user_memory = self._get_user_memory(user_id)
        user_memory.save_context({"input": query}, {"output": answer})
        
        # 4. Extract information for user profile
        conversation_text = f"User: {query} Assistant: {answer}"
        extracted_info = self._extract_user_info(conversation_text)
        
        if extracted_info:
            self.db_dao.update_user_profile_with_info(user_id, extracted_info)
        
        # Extract symptoms for logging
        try:
            today = datetime.now(pytz.UTC).date()
            extracted_symptoms = self.db_dao.extract_symptoms_from_text(query)
            
            # Log each symptom found
            for symptom in extracted_symptoms:
                self.db_dao.log_symptom(
                    self.db_dao.db,
                    user_id,
                    today,
                    symptom["name"],
                    symptom["severity"]
                )
        except Exception as e:
            print(f"Error extracting or logging symptoms: {e}")
        
        # 5. Check if we need to create medium-term summary (after 3-5 interactions)
        try:
            recent_conversations = self.db_dao.get_user_interactions_raw(user_id, limit=5)
            if len(recent_conversations) >= 3:  # Create medium-term summary after 3 interactions
                # Generate summary of recent conversations
                combined_text = " ".join([
                    f"User: {conv.get('prompt', '')} Assistant: {conv.get('answer', '')}"
                    for conv in recent_conversations
                ])
                medium_term_summary = self._generate_enhanced_summary(combined_text)
                
                # Create embedding for the summary
                summary_embedding = self.embeddings.embed_query(medium_term_summary)
                
                # Save medium-term memory
                self.db_dao.save_user_embedding(
                    user_id, 
                    summary_embedding, 
                    medium_term_summary, 
                    None,  # No reference to specific raw conversation
                    {"created_at": now.isoformat(), "summary_type": "medium_term"}
                )
        except Exception as e:
            print(f"Error creating medium-term summary: {e}")
        
        # 6. Check if we need to create daily summary (once per day)
        try:
            last_daily_summary = self.db_dao.get_latest_daily_summary(user_id)
            if not last_daily_summary or self._is_different_day(last_daily_summary.get("metadata", {}).get("created_at", ""), now):
                # Get all conversations from today
                today_start = datetime(now.year, now.month, now.day, tzinfo=pytz.UTC)
                today_conversations = self.db_dao.get_user_interactions_by_timeframe(
                    user_id, 
                    start_time=today_start.isoformat(), 
                    end_time=now.isoformat()
                )
                
                if today_conversations:
                    # Generate summary of all today's conversations
                    combined_text = " ".join([
                        f"User: {conv.get('prompt', '')} Assistant: {conv.get('answer', '')}"
                        for conv in today_conversations
                    ])
                    daily_summary = self._generate_comprehensive_summary(combined_text)
                    
                    # Save daily summary
                    self.db_dao.save_user_daily_summary(
                        user_id,
                        daily_summary,
                        {"created_at": now.isoformat(), "date": today_start.isoformat()}
                    )
        except Exception as e:
            print(f"Error creating daily summary: {e}")
    
    def cleanup_inactive_memories(self):
        """Remove in-memory contexts for inactive users"""
        current_time = datetime.now(pytz.UTC)
        keys_to_remove = []
        
        for memory_key, memory in self.user_memories.items():
            # Check if memory has a last_accessed attribute
            last_accessed = getattr(memory, 'last_accessed', None)
            
            # If not, set one as the current time
            if not last_accessed:
                memory.last_accessed = current_time
                continue
            
            # Remove if inactive for more than 1 hour
            if (current_time - last_accessed).total_seconds() > 3600:  # 1 hour
                keys_to_remove.append(memory_key)
        
        # Remove inactive memories
        for key in keys_to_remove:
            del self.user_memories[key]