from typing import List, Dict, Any
import asyncio
from langchain.memory import ConversationBufferMemory, ConversationBufferWindowMemory
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.globals import set_llm_cache
from langchain_community.cache import InMemoryCache
from langchain_pinecone import PineconeVectorStore as PineconeStore
from langchain.prompts import PromptTemplate
from langchain.chains import ConversationalRetrievalChain
from langchain.schema import HumanMessage
from dotenv import load_dotenv
import json

from rag.symspell import MedicalTermExtractor
from rag.summary import ConversationManager
from rag.rag_base import MedicalRAGPipeline
from database.db_dao import * # Use module for profile calls

from rag.verification import SourceVerifier

load_dotenv()

class MedicalRAGPipelineWithMemory(MedicalRAGPipeline):
    def __init__(
        self,
        db,
        embedding_model: str = "pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb",
        llm_model: str = "gemini-1.5-pro",
        batch_size: int = 500,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        use_gpu: bool = True,
        token_limit: int = 1500,
        top_k: int = 10,
        recent_turns: int = 3,
        max_short_term: int = 5
    ):
        super().__init__(
            llm_model=llm_model,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            use_gpu=use_gpu
        )

        self.db = db
        # self.fuzzy_trie = FuzzyTrie()

        # self.trie_path = f'menopause_terms.pkl'

        # if os.path.exists(self.trie_path):
        #     with open(self.trie_path, 'rb') as f:
        #         self.trie = pickle.load(f)
        with open("Data/UMLS/menopause_terms.json", "r") as file:
            self.vocabulary = set(json.load(file))

        self.medical_extractor = MedicalTermExtractor(self.vocabulary, {}, max_edit_distance=2)
        
        set_llm_cache(InMemoryCache())
        self.token_limit = token_limit
        self.verifier = SourceVerifier()
        self.top_k = top_k
        self.batch_size = batch_size
        self.index_name = "medical-rag-index"
        self.active_memories = {}  # Added to fix the undefined variable

        # Conversation manager for memory tiers
        self.conversation_manager = ConversationManager(
            db_dao=self,
            recent_turns=recent_turns,
            max_short_term=max_short_term,
            token_limit=token_limit
        )

        # Embedding model for similarity searches
        self.embeddings = HuggingFaceEmbeddings(
            model_name=embedding_model,
            encode_kwargs={"normalize_embeddings": True}
        )

        # Pinecone vector store and retriever
        self.pinecone_store = PineconeStore.from_existing_index(
            index_name=self.index_name,
            embedding=self.embeddings,
            text_key="text"
        )
        self.pinecone_retriever = self.pinecone_store.as_retriever(
            search_type="mmr",
            search_kwargs={"k": self.top_k}
        )

        self.similarity_threshold = 0.5

    def _get_or_create_memory(self, user_id: str, conversation_id: str) -> ConversationBufferMemory:
        """Get or create a memory instance for this user and conversation."""
        
        memory_key = f"{user_id}_{conversation_id}"
        
        if memory_key in self.active_memories:
            return self.active_memories[memory_key]
            
        # Create new memory if not found
        memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key="answer"
        )
        
        self.active_memories[memory_key] = memory
        return memory
        
    # DAO passthroughs
    def get_user_interactions_raw(self, user_id: str, limit: int):
        return get_user_interactions_raw(self.db, user_id, limit)

    def get_user_profile(self, user_id: str):
        # Fetch from user_profiles collection, not credentials
        return get_user_profile(self.db, user_id)

    def save_user_interaction_raw(self, user_id: str, prompt: str, answer: str, metadata: Dict):
        return save_user_interaction_raw(self.db, user_id, prompt, answer, metadata)

    def get_user_embeddings(self, user_id: str, limit: Optional[int] = None):
        return get_user_embeddings(self.db, user_id, limit)

    def save_user_embedding(
        self,
        user_id: str,
        embedding: List[float],
        summary: str,
        raw_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ):
        return save_user_embedding(self.db, user_id, embedding, summary, raw_id, metadata)

    def update_user_profile_with_info(self, user_id: str, info: Dict[str, Any]):
        return update_user_profile_with_info(self.db, user_id, info)

    def get_user_embeddings_by_type(self, user_id: str, summary_type: str):
        return get_user_embeddings_by_type(self.db, user_id, summary_type)

    def get_latest_daily_summary(self, user_id: str):
        return get_latest_daily_summary(self.db, user_id)

    def get_user_daily_summaries(self, user_id: str, limit: Optional[int] = None):
        return get_user_daily_summaries(self.db, user_id, limit)

    def save_user_daily_summary(self, user_id: str, summary: str, metadata: Optional[Dict] = None):
        return save_user_daily_summary(self.db, user_id, summary, metadata)

    def get_user_interactions_by_timeframe(
        self,
        user_id: str,
        start_time: str,
        end_time: str
    ):
        return get_user_interactions_by_timeframe(self.db, user_id, start_time, end_time)

    # Single RAG retrieval method
    def retrieve_chunks(self, query: str) -> List:
        return self.pinecone_store.similarity_search(
            query=query,
            k=self.top_k
        )
    
    def get_user_conversations(self, user_id: str) -> Dict[str, Any]:
        """Get a user's recent conversations and summaries."""
        return self.conversation_manager.get_recent_conversations(user_id)

    # Core query with context
    async def query_with_memory(
        self,
        query: str,
        user_id: str,
        conversation_id: str = "qa"
    ) -> Dict[str, Any]:
        try:
            # context = self.conversation_manager.prepare_context_for_llm(user_id, query)
            # context_prompt = self.conversation_manager.create_optimized_prompt(
            #     query, context, max_tokens=self.token_limit
            # )
            context_prompt = ""

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self._execute_query_with_context(query, context_prompt)
            )

            # Use a try/except block to handle any errors in save_conversation
            # try:
            #     await loop.run_in_executor(
            #         None,
            #         lambda: self.conversation_manager.save_conversation(
            #             user_id=user_id,
            #             query=query,
            #             answer=result["answer"]
            #         )
            #     )
            # except Exception as e:
            #     print(f"Error in save_conversation: {str(e)}")
            #     # Continue even if save_conversation fails

            return {
                "user_id": user_id,
                "query": query,
                "answer": result["answer"],
                "chunks": result.get("source_documents", []),
                "citations": result.get("citations", {})
            }
        except Exception as e:
            print(f"Error in query_with_memory: {str(e)}")
            # Return a graceful error response
            return {
                "user_id": user_id,
                "query": query,
                "answer": f"I apologize, but I encountered an error processing your request. Please try asking your question again.",
                "chunks": [],
                "citations": {}
            }

    def _execute_query_with_context(
        self,
        query: str,
        context_prompt: str
    ) -> Dict[str, Any]:
        memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key="answer",
            k=3
        )
        if context_prompt:
            memory.chat_memory.add_user_message("Context: " + context_prompt)

        qa_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=self.pinecone_retriever,
            memory=memory,
            return_source_documents=True,
            combine_docs_chain_kwargs={
                "prompt": PromptTemplate.from_template(
                    """
                    You are a medical AI assistant specialized in menopause talking to a patient. 
                    Use the context and conversation history to answer the question in a friendly tone.

                    {chat_history}

                    ### Context:
                    {context}

                    Question: {question}
                    Answer:
                    """
                )
            }
        )
        try:
            result = qa_chain.invoke({"question": query})
            chunks = self.retrieve_chunks(query)

            docs = chunks
            result["source_documents"] = docs
            
            # similarity = self._check_embedding_similarity(query, chunks[0])
            # if len(scores) > 0 and scores[0] < self.similarity_threshold:
            #     return result
            
            found = self.medical_extractor.lookup(query)
                    
            if not found:
                return result
        
            all_citations = self.verifier.get_all_sources_from_chunks(docs)
            
            formatted_answer = self.verifier.format_citation(
                all_citations, 
                result["answer"]
            )
            
            # Add citations to result
            result["citations"] = all_citations
            result["answer"] = formatted_answer

            return result
        except Exception as e:
            print(f"Error in _execute_query_with_context: {str(e)}")
            return {
                "answer": "I apologize, but I encountered an error processing your query. Could you please rephrase your question?",
                "source_documents": []
            }