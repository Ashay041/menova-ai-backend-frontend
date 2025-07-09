from typing import List, Optional, Dict, Any, Tuple
from langchain.docstore.document import Document
from langchain_core.retrievers import BaseRetriever
from langchain_community.vectorstores import Pinecone as PineconeStore
from langchain_community.embeddings import HuggingFaceEmbeddings
from pinecone import Pinecone
from pinecone import ServerlessSpec
from transformers import AutoTokenizer
import numpy as np
import os

from dotenv import load_dotenv

load_dotenv()

class HybridRetriever(BaseRetriever):
    def __init__(
        self,
        index_n: str,
        embedding_model_name: str = "pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb",
        sparse_model_tokenizer: Optional[str] = None,
        rrf_k: int = 60  # RRF constant k parameter
    ):
        self.ind_name = index_n
        self.rrf_k = rrf_k
        
        self.pinecone_index = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        
        self.embeddings = HuggingFaceEmbeddings(
            model_name=embedding_model_name,
            encode_kwargs={"normalize_embeddings": True}
        )
        
        # # Ensure index exists
        self.initialize_index()
    
    def initialize_index(self):
        if not self.pinecone_index.has_index(name=self.index_name):
            self.pinecone_index.create_index(
                name=self.index_name,
                dimension=1536,  # dimensionality of text-embedding-ada-002
                metric='dotproduct',
                spec=ServerlessSpec(
                cloud='aws',
                region='us-east-1'
            )
        )

        self.pinecone_index.describe_index(name=self.index_name)
    
    def _generate_sparse_embedding(self, text: str) -> Dict[str, List]:
        embeddings = self.pinecone_index.inference.embed(
            model="pinecone-sparse-english-v0",
            inputs=text,
            parameters={"input_type": "passage", "return_tokens": True}
        )

        return embeddings
    
    def _generate_dense_embedding(self, text: str, input_type:str = "passage") -> List[float]:
        # embeddings = self.pinecone_index.inference.embed(
        #     model="multilingual-e5-large",
        #     inputs=text,
        #     parameters={"input_type": input_type, "truncate": "END"}
        # )
        embeddings = self.embeddings.embed_query(text)

        return embeddings
    
    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Implementation of the abstract method."""
        return self.hybrid_search(query)
    
    def hybrid_search(
        self,
        query: str,
        k: int = 5,
        collection_name: Optional[str] = None,
        alpha: float = 0.5,  # Weight for hybrid search (1.0 = dense only, 0.0 = sparse only)
        use_rrf: bool = True  # Whether to use RRF for final ranking
    ) -> List[Document]:
       
        if collection_name is None:
            collection_name = self.index_name
        
        if use_rrf:
            return self._rrf_search(query, k, collection_name)
        
        dense_embedding = self._generate_dense_embedding(query, "query")
        sparse_embedding = self._generate_sparse_embedding(query)
        
        results = self.pinecone_index.query(
            vector=dense_embedding,
            sparse_vector=sparse_embedding,
            top_k=k,
            include_metadata=True,
            namespace=collection_name,
            alpha=alpha
        )
        
        docs = []
        for match in results["matches"]:
            metadata = match.get("metadata", {})
            page_content = metadata.pop("text", "")
            doc = Document(page_content=page_content, metadata=metadata)
            doc.metadata["score"] = match["score"]
            docs.append(doc)
        
        return docs
    
    def _rrf_search(
        self,
        query: str,
        k: int = 5,
        collection_name: Optional[str] = None,
    ) -> List[Document]:
        """
        Perform RRF search with separate dense and sparse searches.
        
        Args:
            query: The query string
            k: Number of documents to retrieve
            collection_name: Namespace in Pinecone
            
        Returns:
            List of retrieved documents
        """
        if collection_name is None:
            collection_name = self.index_name
        
        # Number of results to retrieve from each method (more than final k)
        search_k = min(k * 3, 100)
        
        # Get dense results
        dense_embedding = self._generate_dense_embedding(query)
        dense_results = self.pinecone_index.query(
            vector=dense_embedding,
            top_k=search_k,
            include_metadata=True,
            namespace=collection_name
        )
        
        sparse_embedding = self._generate_sparse_embedding(query)
        sparse_results = self.pinecone_index.query(
            sparse_vector=sparse_embedding,
            top_k=search_k,
            include_metadata=True,
            namespace=collection_name
        )
        
        combined_docs = self._apply_rrf(dense_results["matches"], sparse_results["matches"], k)
        
        return combined_docs
    
    def _apply_rrf(
        self,
        dense_matches: List[Dict],
        sparse_matches: List[Dict],
        k: int
    ) -> List[Document]:
        """
        Apply Reciprocal Rank Fusion to combine dense and sparse search results.
            
        Returns:
            List of Documents ranked by RRF score
        """
        dense_ranks = {match["id"]: idx + 1 for idx, match in enumerate(dense_matches)}
        sparse_ranks = {match["id"]: idx + 1 for idx, match in enumerate(sparse_matches)}
        
        all_ids = set(dense_ranks.keys()) | set(sparse_ranks.keys())
        
        # Calculate RRF scores
        rrf_scores = {}
        for doc_id in all_ids:
            # Get ranks (use a large value if document wasn't in the results)
            dense_rank = dense_ranks.get(doc_id, len(dense_matches) + 1)
            sparse_rank = sparse_ranks.get(doc_id, len(sparse_matches) + 1)
            
            # Calculate RRF score: 1/(k + rank_i)
            dense_score = 1.0 / (self.rrf_k + dense_rank)
            sparse_score = 1.0 / (self.rrf_k + sparse_rank)
            
            # Sum of scores
            rrf_scores[doc_id] = dense_score + sparse_score
        
        sorted_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)[:k]
        
        all_matches = {}
        for match in dense_matches + sparse_matches:
            if match["id"] not in all_matches:
                all_matches[match["id"]] = match
        
        docs = []
        for doc_id in sorted_ids:
            if doc_id in all_matches:
                match = all_matches[doc_id]
                metadata = match.get("metadata", {})
                page_content = metadata.pop("text", "")
                doc = Document(page_content=page_content, metadata=metadata)
                doc.metadata["score"] = rrf_scores[doc_id]  # Add RRF score
                docs.append(doc)
        
        return docs