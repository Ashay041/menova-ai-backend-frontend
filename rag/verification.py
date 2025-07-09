import re
from typing import List, Dict, Any, Optional, Set, Tuple

class SourceVerifier:
    """
    A class to handle citations from medical sources including doctors and health websites.
    This class provides methods to extract, validate, and format citations.
    """
    
    def __init__(self):
        # Common reliable health websites and organizations
        self.reliable_websites = [
            "Mayo Clinic", 
            "Cleveland Clinic", 
            "NIH", 
            "National Institutes of Health",
            "CDC", 
            "Centers for Disease Control",
            "WHO", 
            "World Health Organization",
            "WebMD", 
            "Healthline", 
            "MedlinePlus",
            "American Cancer Society",
            "American Heart Association",
            "American Medical Association",
            "Harvard Health",
            "Johns Hopkins Medicine",
            "ACOG",
            "American College of Obstetricians and Gynecologists",
            "NAMS",
            "North American Menopause Society"
        ]
        
        # Compile regex patterns for better performance
        self.doctor_pattern = re.compile(r"Dr\.?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)")
        self.md_pattern = re.compile(r"([A-Z][a-z]+\s+[A-Z][a-z]+),\s+M\.?D\.?")
        self.website_pattern = re.compile(r"(https?://(?:www\.)?([a-zA-Z0-9-]+)\.(?:[a-zA-Z0-9-]+)(?:\.[a-zA-Z0-9-]+)*)")
        
        # Patterns to identify conversational vs medical queries
        self.conversational_patterns = [
            r"\bhow are you\b",
            r"\bhello\b",
            r"\bhi\b",
            r"\bhey\b",
            r"\bgood morning\b",
            r"\bgood afternoon\b",
            r"\bgood evening\b",
            r"\bthank(s| you)\b",
            r"\bnice to meet you\b",
            r"\bappreciate\b",
            r"\bhow('s| is) it going\b"
        ]
        self.conversational_regex = re.compile('|'.join(self.conversational_patterns), re.IGNORECASE)
    
    def is_conversational_query(self, query: str) -> bool:
        """
        Determine if a query is conversational rather than medical/informational.
        
        Args:
            query: The user's query
            
        Returns:
            True if query appears to be conversational, False otherwise
        """
        return bool(self.conversational_regex.search(query))
    
    def extract_citations(self, metadata: Dict[str, Any]) -> Dict[str, List[str]]:
        """
        Extract citations from document metadata.
        
        Args:
            metadata: The metadata dictionary from the document
            
        Returns:
            Dictionary with 'doctors' and 'websites' lists
        """
        doctors = []
        websites = []
        
        # Check if metadata exists
        if not metadata:
            return {"doctors": doctors, "websites": websites}
        
        # Extract from source field if it exists
        source_text = metadata.get('source', '')
        if source_text:
            # Extract doctors
            doctors.extend(self._extract_doctor_names(source_text))
            
            # Extract websites
            websites.extend(self._extract_websites(source_text))
            
            # Check for reliable health websites by name
            for site in self.reliable_websites:
                if site in source_text:
                    websites.append(site)
        
        # Extract from section field if it exists
        section_text = metadata.get('section', '')
        if section_text:
            # Extract doctors
            doctors.extend(self._extract_doctor_names(section_text))
        
        # Return unique values only
        return {
            "doctors": list(set(doctors)),
            "websites": list(set(websites))
        }
    
    def _extract_doctor_names(self, text: str) -> List[str]:
        """
        Extract doctor names from text using multiple patterns.
        
        Args:
            text: The text that might contain doctor names
            
        Returns:
            List of extracted doctor names
        """
        doctors = []
        
        # Look for "Dr. FirstName LastName" pattern
        dr_matches = self.doctor_pattern.finditer(text)
        for match in dr_matches:
            doctor_name = match.group(0).strip()
            doctors.append(doctor_name)
        
        # Look for "FirstName LastName, MD" pattern
        md_matches = self.md_pattern.finditer(text)
        for match in md_matches:
            name = match.group(1).strip()
            doctor_name = f"Dr. {name}"
            doctors.append(doctor_name)
        
        return doctors
    
    def _extract_websites(self, text: str) -> List[str]:
        """
        Extract website names from text.
        
        Args:
            text: The text that might contain website URLs
            
        Returns:
            List of extracted website names
        """
        websites = []
        
        # Extract URLs
        url_matches = self.website_pattern.finditer(text)
        for match in url_matches:
            full_url = match.group(1)
            domain = match.group(2)
            
            # Format domain name to be more readable
            domain = domain.replace('-', ' ').title()
            
            # Check if domain is a known health website
            for site in self.reliable_websites:
                if site.lower() in domain.lower():
                    websites.append(site)
                    break
            else:
                # If not a known site, just use the domain
                websites.append(domain)
        
        return websites
    
    def format_citation(self, citations: Dict[str, List[str]], answer: str, query: str = "") -> str:
        """
        Format the answer with appropriate citations if they're not already included.
        Skip citations for conversational queries.
        
        Args:
            citations: Dictionary with 'doctors' and 'websites' lists
            answer: The original answer text
            query: The original user query (optional)
            
        Returns:
            Formatted answer with citations if appropriate
        """
        # Skip citations for conversational queries
        if query and self.is_conversational_query(query):
            return answer
            
        doctors = citations.get('doctors', [])
        websites = citations.get('websites', [])
        
        # Check if any citations are already in the answer
        has_citation = False
        for doctor in doctors:
            if doctor in answer:
                has_citation = True
        
        for website in websites:
            if website in answer:
                has_citation = True
        
        # If no citations are in the answer yet, add one
        if not has_citation and (doctors or websites):
            # Prioritize doctor citations over websites
            citation_phrase = ""
            citation_added = False
            
            # Add doctor citations (up to 2)
            for i, doctor in enumerate(doctors[:2]):
                if i == 0:
                    citation_phrase = doctor.replace(',', '')
                    citation_added = True
                else:
                    citation_phrase += f", {doctor.replace(',', '')}"
            
            # Add website citations if no doctors (up to 2)
            if not citation_added and websites:
                for i, website in enumerate(websites[:2]):
                    if i == 0:
                        citation_phrase = website.replace(',', '')
                    else:
                        citation_phrase += f", {website.replace(',', '')}"
                        
            if citation_phrase:
                answer = f"{answer} [{citation_phrase}]"
                
        return answer
    
    def get_all_sources_from_chunks(self, chunks: List) -> Dict[str, List[str]]:
        """
        Extract all sources from a list of document chunks.
        
        Args:
            chunks: List of document chunks with metadata
            
        Returns:
            Dictionary with combined 'doctors' and 'websites' lists
        """
        all_doctors = set()
        all_websites = set()
        
        for chunk in chunks:
            if hasattr(chunk, 'metadata'):
                citations = self.extract_citations(chunk.metadata)
                all_doctors.update(citations.get('doctors', []))
                all_websites.update(citations.get('websites', []))
        
        return {
            "doctors": list(all_doctors),
            "websites": list(all_websites)
        }