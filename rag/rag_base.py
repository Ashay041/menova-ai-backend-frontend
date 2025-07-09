from utilities.pdf_process import MedicalPDFProcessor

from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain.chat_models import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
# import torch
from typing import List, Any, Optional
import os
from dotenv import load_dotenv

class MedicalRAGPipeline:
    """
    Retrieval-Augmented Generation pipeline specialized for medical documents.
    Uses FAISS for vector storage and optimized for medical domain content.
    """

    def __init__(
        self,
        llm_model: str = "gemini-1.5-pro",
        db_directory: str = "medical_db",
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        use_gpu: bool = True
    ):
        """
        Args:
            llm_model: Hugging Face model for generation (preferably with medical knowledge)
            db_directory: Directory to store the FAISS database
            chunk_size: Size of document chunks
            chunk_overlap: Overlap between chunks
            use_gpu: Whether to use GPU. If None, will auto-detect.
        """
        self.llm_model = llm_model
        self.use_gpu = use_gpu
        self.db_directory = db_directory
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        load_dotenv()
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable not found")
        
        self.llm = ChatGoogleGenerativeAI(
            model=self.llm_model,
            temperature=0.5,
            max_tokens=500,
            timeout=None,
            max_retries=2,
            google_api_key=gemini_api_key
            # streaming=True  # Enable streaming

        )

        # Determine device
        # if use_gpu is None:
        #     self.device = "cuda" if torch.cuda.is_available() else "cpu"
        # else:
        #     self.device = "cuda" if use_gpu and torch.cuda.is_available() else "cpu"

        self.device = "cpu"
            
        print(f"Using device: {self.device}")
        
        # Initialize PDF processor
        self.pdf_processor = MedicalPDFProcessor()
        
        # Initialize text splitter with medical domain settings
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )
        

    def process_pdf(self, pdf_path: str) -> List[Document]:
        """
        Process a medical PDF into Document objects.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of processed Document objects
        """
        # Extract raw documents from PDF
        raw_documents = self.pdf_processor.process_pdf(pdf_path)
        
        # Split into chunks
        chunks = self.text_splitter.split_documents(raw_documents)
        
        print(f"Processed {pdf_path} into {len(chunks)} chunks")
        
        return chunks

    def process_pdf_directory(self, directory_path: str) -> List[Document]:
        """
        Process all PDFs in a directory.
        
        Args:
            directory_path: Path to directory containing PDFs
            
        Returns:
            List of all Document chunks from all PDFs
        """
        all_chunks = []
        
        # Get all PDF files in the directory
        pdf_files = [f for f in os.listdir(directory_path) if f.lower().endswith('.pdf')]
        
        if not pdf_files:
            print(f"No PDF files found in {directory_path}")
            return all_chunks
        
        print(f"Found {len(pdf_files)} PDF files")
        
        # Process each PDF
        for pdf_file in pdf_files:
            pdf_path = os.path.join(directory_path, pdf_file)
            chunks = self.process_pdf(pdf_path)
            all_chunks.extend(chunks)
            
        return all_chunks


    def ingest_and_store(
        self, 
        pdf_path: str, 
        collection_name: Optional[str] = None
    ) -> str:
        """
        Complete pipeline to ingest, process, and store PDF documents.
        
        Args:
            pdf_path: Path to PDF file or directory containing PDFs
            collection_name: Optional name for the collection
            
        Returns:
            Collection name
        """
        # Check if path is file or directory
        if os.path.isdir(pdf_path):
            # Process directory of PDFs
            chunks = self.process_pdf_directory(pdf_path)
        else:
            # Process single PDF
            chunks = self.process_pdf(pdf_path)
            
        if not chunks:
            raise ValueError(f"No content could be extracted from {pdf_path}")
            
        # Store chunks in FAISS
        collection_name = self.store_documents(chunks, collection_name)
        
        return collection_name