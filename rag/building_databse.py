import os
import re
import nltk
import PyPDF2
from typing import List, Dict, Any, Optional, Tuple, Union
from tqdm import tqdm
from nltk.corpus import stopwords
from dotenv import load_dotenv
from pinecone import ServerlessSpec

# Load environment variables
load_dotenv()

# LangChain imports
from langchain.text_splitter import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter
from langchain.schema import Document, BaseDocumentTransformer
from langchain.embeddings import HuggingFaceEmbeddings

from langchain_community.vectorstores import Pinecone as PineconeStore
from pinecone import Pinecone

class MedicalHeaderTextSplitter(MarkdownHeaderTextSplitter):
    """Custom text splitter for medical documents that respects section headers."""
    
    def __init__(self):
        headers_to_split_on = [
            ("#", "chapter"),
            ("##", "section"),
            ("###", "subsection"),
            ("####", "recommendation"),
            ("#####", "remarks")
        ]
        super().__init__(headers_to_split_on=headers_to_split_on)
        
    def _add_md_header(self, text):
        """Convert medical document headers to markdown format."""
        # Convert chapter headers
        text = re.sub(r'(?m)^(?:Chapter|CHAPTER)\s+(\d+)[\.:]?\s+(.+)$', r'# \1 \2', text)
        
        # Convert section headers
        text = re.sub(r'(?m)^(?:\d+\.\d+\.?\s+|\d+\.\s+)([A-Z][A-Za-z\s\-:]+)$', r'## \1', text)
        
        # Convert subsection headers
        text = re.sub(r'(?m)^(?:[A-Z]\.\d+\.?\s+|[A-Z]\.\s+)([A-Za-z][A-Za-z\s\-:]+)$', r'### \1', text)
        
        # Convert recommendation headers
        text = re.sub(
            r'(?m)^RECOMMENDATION\s+([A-Z0-9\.]+):\s+(.+?)(?:\((?:Recommended|Context-specific|Not recommended).*?\))?$', 
            r'#### RECOMMENDATION \1: \2', 
            text
        )
        
        # Convert remarks sections
        text = re.sub(r'(?m)^Remarks:$', r'##### Remarks:', text)
        
        return text

class MedicalEvidenceExtractor(BaseDocumentTransformer):
    """Extract evidence levels and recommendation types from medical text."""
    
    def __init__(self):
        self.evidence_pattern = re.compile(r'(?:high|moderate|low|very\s+low)(?:-|\s+)(?:quality|certainty)\s+evidence', re.IGNORECASE)
        self.recommendation_type_pattern = re.compile(r'\((Recommended|Context-specific recommendation|Not recommended).*?\)')
    
    def transform_documents(
        self, documents: List[Document], **kwargs
    ) -> List[Document]:
        """Extract evidence levels and enhance document metadata."""
        for doc in documents:
            # Only process if it's a recommendation
            if doc.metadata.get('heading_type') == 'recommendation':
                # Extract evidence level
                evidence_match = self.evidence_pattern.search(doc.page_content)
                if evidence_match:
                    doc.metadata['evidence_level'] = evidence_match.group(0)
                
                # Extract recommendation type
                rec_type_match = self.recommendation_type_pattern.search(doc.page_content)
                if rec_type_match:
                    doc.metadata['recommendation_type'] = rec_type_match.group(1)
                
                # Extract recommendation ID
                rec_id_match = re.search(r'RECOMMENDATION\s+([A-Z0-9\.]+):', doc.page_content)
                if rec_id_match:
                    doc.metadata['recommendation_id'] = rec_id_match.group(1)
        
        return documents

class TableExtractor(BaseDocumentTransformer):
    """Extract tables as separate documents with metadata."""
    
    def transform_documents(
        self, documents: List[Document], **kwargs
    ) -> List[Document]:
        """Identify and mark table content."""
        table_pattern = re.compile(r'(Table\s+\d+[\.:]?\s+.*?)(?:\n\n|\Z)', re.DOTALL)
        
        result_docs = []
        for doc in documents:
            # Find tables in the document
            tables = table_pattern.findall(doc.page_content)
            
            # If tables found, create separate documents for them
            if tables:
                # Create a copy of the original document with tables removed
                modified_content = doc.page_content
                for table in tables:
                    modified_content = modified_content.replace(table, "")
                
                # Add the modified document if it still has significant content
                if len(modified_content.strip()) > 100:
                    modified_doc = Document(
                        page_content=modified_content,
                        metadata=doc.metadata.copy()
                    )
                    result_docs.append(modified_doc)
                
                # Add each table as a separate document
                for table in tables:
                    if len(table.strip()) > 50:  # Skip very small tables
                        table_doc = Document(
                            page_content=table,
                            metadata={
                                **doc.metadata.copy(),
                                "chunk_type": "table",
                                "parent_section_path": doc.metadata.get("section_path", [])
                            }
                        )
                        result_docs.append(table_doc)
            else:
                # No tables, keep the original document
                result_docs.append(doc)
                
        return result_docs

class MedicalProcessor:
    """Combined medical document processor with advanced PDF processing and semantic analysis."""
    
    def __init__(
        self, 
        chunk_size: int = 1000, 
        chunk_overlap: int = 200,
        embedding_model_name: str = "pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb"
    ):
        # Download necessary NLTK resources
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt', quiet=True)
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords', quiet=True)
            
        self.stop_words = set(stopwords.words('english'))
        
        # Initialize Pinecone
        self.pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        print(os.getenv("PINECONE_API_KEY"))
        
        self.index_name = "medical-rag-index"
        # Create index if it doesn't exist
       

        if not self.pc.has_index(name=self.index_name):
            # Create a new index
            self.pc.create_index(
                name=self.index_name,
                dimension=1536,  # dimensionality of text-embedding-ada-002
                metric='dotproduct',
                spec=ServerlessSpec(
                cloud='aws',
                region='us-east-1'
            )
        )

        self.pc.describe_index(name=self.index_name)
                
        # Medical-specific abbreviations and terms
        self.medical_abbreviations = {
            "pt": "patient", "pts": "patients", "dx": "diagnosis", 
            "tx": "treatment", "hx": "history", "fx": "fracture",
            "sx": "symptoms", "rx": "prescription", "appt": "appointment",
            "vs": "vital signs", "yo": "year old", "y/o": "year old",
            "labs": "laboratory tests", "hpi": "history of present illness",
            "w/": "with", "s/p": "status post", "c/o": "complains of",
            "p/w": "presents with", "h/o": "history of", "f/u": "follow up"
        }
        
        # Initialize document processing parameters
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.embedding_model_name = embedding_model_name
        
        # Initialize document processing pipeline
        self.header_splitter = MedicalHeaderTextSplitter()
        self.paragraph_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        self.evidence_extractor = MedicalEvidenceExtractor()
        self.table_extractor = TableExtractor()
        
        # Initialize embedding model
        self.embeddings = HuggingFaceEmbeddings(
            model_name=embedding_model_name,
            encode_kwargs={"normalize_embeddings": True}
        )
        self.db = None
        
            
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from a PDF file with medical-specific preprocessing."""
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            
            # Extract text from each page
            for page in reader.pages:
                text += page.extract_text() + "\n"
                
        # Basic cleaning
        text = self._clean_text(text)
        
        return text
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize medical text."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Expand common medical abbreviations
        for abbr, expansion in self.medical_abbreviations.items():
            # Only replace when it's a whole word (with word boundaries)
            text = re.sub(r'\b' + re.escape(abbr) + r'\b', expansion, text, flags=re.IGNORECASE)
            
        # Normalize spacing after periods for better sentence splitting
        text = re.sub(r'\.(?! )', '. ', text)
        
        return text
    
    def split_into_common_sections(self, text: str) -> List[str]:
        """Split medical document into logical sections based on common headers."""
        common_sections = [
            "History", "Physical Examination", "Assessment", "Plan", "Diagnosis",
            "Chief Complaint", "Past Medical History", "Medications", "Allergies",
            "Family History", "Social History", "Review of Systems", "Labs",
            "Imaging", "Discussion", "Conclusion", "Recommendations"
        ]
        
        # Create regex pattern for section headers
        pattern = r'(?i)(?:^|\n)(' + '|'.join(re.escape(s) for s in common_sections) + r')(?::|:)?\s*(?:\n|\s)'
        
        # Find all section headers with their positions
        matches = list(re.finditer(pattern, text))
        
        sections = []
        
        # Extract each section
        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i+1].start() if i < len(matches) - 1 else len(text)
            
            # Get the section header and content
            header = match.group(1)
            content = text[start:end].strip()
            
            # Add the section
            sections.append(f"{header}:\n{content}")
            
        # If no sections were identified, return the whole text as one section
        if not sections:
            sections = [text]
            
        return sections
    
    def _extract_document_metadata(self, text: str) -> Dict[str, str]:
        """Extract document-level metadata."""
        title = ""
        doc_type = "Unknown"
        
        # Try to find title from first line
        first_line = text.split('\n')[0].strip()
        if first_line and len(first_line) < 200:  # Reasonable title length
            title = first_line
        
        # Simplified metadata
        return {
            "title": title[:100] if title else "",  # Limit title length
            "type": doc_type
        }
    
    def _build_section_path(self, doc: Document) -> str:
        """Build a compact section path string."""
        parts = []
        for key in ['chapter', 'section', 'subsection']:
            if key in doc.metadata:
                # Take first 50 chars of each section name
                parts.append(str(doc.metadata[key])[:50])
        return " > ".join(parts)
    
    def process_text(self, text: str, source_name: str = "") -> List[Document]:
        """Process text into chunks with minimal metadata."""
        # Extract minimal document metadata
        doc_metadata = self._extract_document_metadata(text)
        
        # Try markdown-based splitting
        md_text = self.header_splitter._add_md_header(text)
        docs = self.header_splitter.split_text(md_text)
        
        # If no proper splitting occurred, try with common section headers
        if len(docs) <= 1 and len(text) > self.chunk_size * 2:
            sections = self.split_into_common_sections(text)
            docs = []
            
            # Create document for each section with minimal metadata
            for section in sections:
                section_parts = section.split(":", 1)
                section_header = section_parts[0] if len(section_parts) > 1 else "Section"
                section_content = section_parts[1] if len(section_parts) > 1 else section
                
                # Ensure metadata values are strings and truncated
                metadata = {
                    "source": str(source_name)[:100] if source_name else "",
                    "type": "text",
                    "section": str(section_header)[:100]
                }
                
                docs.append(Document(
                    page_content=section_content,
                    metadata=metadata
                ))
        
        # Process each document
        final_docs = []
        for doc in docs:
            # Create minimal metadata dict with string values
            minimal_metadata = {
                "source": str(doc.metadata.get("source", ""))[:100],
                "type": "recommendation" if doc.metadata.get("heading_type") == "recommendation" else "text",
                "section": str(doc.metadata.get("section", ""))[:100]
            }
            
            # Split if needed
            if len(doc.page_content) > self.chunk_size:
                smaller_chunks = self.paragraph_splitter.split_text(doc.page_content)
                for chunk in smaller_chunks:
                    chunk_doc = Document(
                        page_content=chunk,
                        metadata=minimal_metadata.copy()  # Use copy to avoid reference issues
                    )
                    final_docs.append(chunk_doc)
            else:
                doc.metadata = minimal_metadata
                final_docs.append(doc)
        
        # Debug: Print sample document metadata
        print("\nSample document metadata after processing:")
        for i, doc in enumerate(final_docs[:3]):
            print(f"Doc {i}:")
            print(f"Content length: {len(doc.page_content)} chars")
            print(f"Metadata: {doc.metadata}\n")
        
        return final_docs
    
    def process_pdf(self, pdf_path: str) -> List[Document]:
        """Process a PDF file with comprehensive medical text analysis."""
        # Extract text with medical abbreviation expansion
        text = self.extract_text_from_pdf(pdf_path)
        
        # Process the text into semantically meaningful chunks
        filename = os.path.basename(pdf_path)
        return self.process_text(text, filename)
    
    def load_documents(self, input_path: str) -> List[Document]:
        """Load documents from file or directory."""
        documents = []
        
        if os.path.isdir(input_path):
            # Process all files in directory
            for filename in os.listdir(input_path):
                file_path = os.path.join(input_path, filename)
                if os.path.isfile(file_path):
                    documents.extend(self._load_single_document(file_path))
        else:
            # Process single file
            documents = self._load_single_document(input_path)
        
        return documents
    
    def _load_single_document(self, file_path: str) -> List[Document]:
        """Load and process a single document."""
        print(f"Processing {file_path}...")
        
        # Load based on file type
        if file_path.lower().endswith('.pdf'):
            return self.process_pdf(file_path)
        else:
            # Handle text files
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            # Process the text
            source_name = os.path.basename(file_path)
            return self.process_text(text, source_name)
    
    def create_vector_store(self, documents: List[Document], collection_name: Optional[str] = None):
        """Create a vector store from processed documents."""
        # Debug: Print metadata sizes before processing
        print("\nAnalyzing document metadata sizes:")
        for i, doc in enumerate(documents[:5]):  # Look at first 5 docs
            metadata_str = str(doc.metadata)
            print(f"Doc {i} metadata size: {len(metadata_str)} bytes")
            print(f"Metadata content: {doc.metadata}\n")

        # Trim metadata to essential fields
        for doc in documents:
            # Keep only essential metadata fields as strings
            essential_metadata = {
                'source': str(doc.metadata.get('source', ''))[:100],
                'type': str(doc.metadata.get('type', 'text')),
                'section': str(doc.metadata.get('section', ''))[:100]
            }
            # Ensure all values are strings and truncated
            doc.metadata = {k: str(v)[:100] for k, v in essential_metadata.items()}

        # Debug: Print metadata sizes after processing
        print("\nMetadata sizes after trimming:")
        for i, doc in enumerate(documents[:5]):  # Look at first 5 docs
            metadata_str = str(doc.metadata)
            print(f"Doc {i} metadata size: {len(metadata_str)} bytes")
            print(f"Metadata content: {doc.metadata}\n")

        self.db = PineconeStore.from_documents(
            documents=documents,
            embedding=self.embeddings,
            index_name=self.index_name
        )

        print(f"Pinecone vector store created with {len(documents)} documents")
        return self.db

    

# Example usage
if __name__ == "__main__":
    processor = MedicalProcessor(
        chunk_size=1000,
        chunk_overlap=200,
    )
    
    # Process a medical PDF
    pdf_path = "/home/vidhij2/femtech/Menova.ai/Data/Heather Currie - Menopause (At Your Fingertips) (2006).pdf"
    if os.path.exists(pdf_path):
        documents = processor.process_pdf(pdf_path)
        print(f"Processed {len(documents)} chunks from {pdf_path}")
        
        # Create vector store
        db=processor.create_vector_store(documents)
        
        # Example of querying
        # print("\nTesting retrieval:")
        # results = db.similarity_search("What are the recommendations for treatment?", k=2)
        # for doc in results:
        #     print(f"\nChunk type: {doc.metadata.get('type', 'unknown')}")
        #     print(f"Section: {doc.metadata.get('section', 'unknown')}")
        #     print(f"Content preview: {doc.page_content[:150]}...")