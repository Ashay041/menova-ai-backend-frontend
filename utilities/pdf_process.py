import PyPDF2
import nltk
from nltk.corpus import stopwords
import re
from langchain.schema import Document
from typing import List, Dict, Any, Optional, Tuple, Union
import os

class MedicalPDFProcessor:
    """Process medical PDFs with specialized techniques for handling medical content."""
    
    def __init__(self):
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
    
    def split_into_sections(self, text: str) -> List[str]:
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
    
    def process_pdf(self, pdf_path: str) -> List[Document]:
        """Process a medical PDF and return LangChain Document objects."""
        # Extract text
        text = self.extract_text_from_pdf(pdf_path)
        
        # Try to split into sections if possible
        sections = self.split_into_sections(text)
        
        # Create Document objects
        documents = []
        
        filename = os.path.basename(pdf_path)
        
        for i, section in enumerate(sections):
            # Create metadata to track source and section
            metadata = {
                "source": filename,
                "page": i,  # Using i as a proxy for page if real page info isn't available
                "section": section.split(":", 1)[0] if ":" in section else "General"
            }
            
            documents.append(Document(page_content=section, metadata=metadata))
            
        return documents