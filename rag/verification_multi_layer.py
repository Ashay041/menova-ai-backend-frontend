import re
import hashlib
import requests
from typing import List, Dict, Any, Optional, Tuple, Union, Set
from functools import lru_cache
from dataclasses import dataclass
from langchain.schema import Document
import datetime
import json
import os.path
from urllib.parse import urlparse

@dataclass
class VerificationSource:
    """Structured representation of a verification source"""
    type: str  # "physician", "medical_board", "journal", "organization", etc.
    name: Optional[str] = None
    credentials: Optional[str] = None
    organization: Optional[str] = None
    date_verified: Optional[str] = None
    url: Optional[str] = None
    verification_method: Optional[str] = None
    
    def to_dict(self):
        """Convert to dictionary, excluding None values"""
        return {k: v for k, v in self.__dict__.items() if v is not None}

class SourceVerifier:
    """
    Advanced verification of medical information sources with multi-layer checking
    and external reference validation.
    """
    
    def __init__(self, cache_file: Optional[str] = "verification_cache.json"):
        # Load predefined lists of trusted sources
        self.trusted_organizations = {
            "who", "cdc", "nih", "mayo clinic", "cleveland clinic", "johns hopkins",
            "acog", "ama", "aap", "nams", "nejm", "jama", "lancet", "bmj",
            "cochrane", "nice", "fda", "emea", "health canada"
        }
        
        self.trusted_domains = {
            "who.int", "cdc.gov", "nih.gov", "mayoclinic.org", "clevelandclinic.org", 
            "hopkinsmedicine.org", "acog.org", "ama-assn.org", "aap.org", "nejm.org",
            "jamanetwork.com", "thelancet.com", "bmj.com", "cochrane.org", 
            "nice.org.uk", "fda.gov", "ema.europa.eu", "canada.ca"
        }
        
        self.medical_credentials = {
            "md", "m.d.", "do", "d.o.", "mbbs", "mph", "ph.d", "phd", "ob-gyn", "obgyn",
            "facog", "facs", "faap", "rn", "np", "pa", "rph", "faan", "facp"
        }
        
        # Patterns for identifying verification statements - expanded and categorized
        # Each pattern is associated with a verification type
        self.verification_patterns = [
            # Doctor verification patterns (higher confidence)
            (re.compile(r'(reviewed|verified|approved)\s+by\s+(?:dr\.?\s+|doctor\s+)([\w\s\-\.]+)', re.IGNORECASE), 
             {"type": "physician", "confidence": 0.9}),
            
            (re.compile(r'(reviewed|verified|approved)\s+by\s+([\w\s\-\.]+),\s*M\.?D\.?', re.IGNORECASE),
             {"type": "physician", "confidence": 0.9}),
            
            (re.compile(r'medical\s+review\s+by\s+([\w\s\-\.]+)', re.IGNORECASE),
             {"type": "physician", "confidence": 0.8}),
             
            (re.compile(r'physician\s+(reviewed|verified|approved)', re.IGNORECASE),
             {"type": "physician", "confidence": 0.7}),
            
            # Specialist verification
            (re.compile(r'(reviewed|verified|approved)\s+by\s+([\w\s\-\.]+),\s*OB-?GYN', re.IGNORECASE),
             {"type": "specialist", "confidence": 0.9}),
             
            (re.compile(r'(reviewed|verified|approved)\s+by\s+board[\s\-]certified\s+([\w\s\-\.]+)', re.IGNORECASE),
             {"type": "specialist", "confidence": 0.9}),
            
            # Institutional verification (highest confidence)
            (re.compile(r'(according|based|verified)\s+to\s+(ACOG|NAMS|AMA|WHO|CDC|NIH)', re.IGNORECASE),
             {"type": "organization", "confidence": 1.0}),
            
            (re.compile(r'(endorsed|recommended|approved)\s+by\s+(ACOG|NAMS|AMA|WHO|CDC|NIH)', re.IGNORECASE),
             {"type": "organization", "confidence": 1.0}),
             
            (re.compile(r'(follows|adheres\s+to)\s+(ACOG|NAMS|AMA|WHO|CDC|NIH)\s+guidelines', re.IGNORECASE),
             {"type": "organization", "confidence": 0.9}),
            
            # Journal verification (high confidence)
            (re.compile(r'published\s+in\s+([\w\s\-\.]+)\s+journal\s+of\s+([\w\s\-\.]+)', re.IGNORECASE),
             {"type": "journal", "confidence": 0.9}),
             
            (re.compile(r'peer[\s\-]reviewed\s+study', re.IGNORECASE),
             {"type": "journal", "confidence": 0.8}),
             
            (re.compile(r'clinical\s+trial\s+published\s+in\s+([\w\s\-\.]+)', re.IGNORECASE),
             {"type": "journal", "confidence": 0.9}),
        ]
        
        # General verification indicators (lower confidence)
        self.verification_indicators = {
            # Higher confidence indicators
            "clinically verified": 0.8,
            "doctor verified": 0.8,
            "physician approved": 0.8,
            "medically reviewed": 0.7,
            "peer-reviewed research": 0.8,
            "evidence-based guidelines": 0.7,
            
            # Medium confidence indicators
            "clinically proven": 0.6,
            "medical fact-checking": 0.6,
            "expert-reviewed": 0.6,
            "medical editorial board": 0.6,
            "medical advisory board": 0.6,
            
            # Lower confidence indicators
            "medically accurate information": 0.4,
            "doctor-reviewed content": 0.5,
            "medical expert input": 0.5
        }
        
        # Initialize verification cache
        self.cache_file = cache_file
        self._verification_cache = {}
        
        # Load cache if available
        if self.cache_file and os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r') as f:
                    self._verification_cache = json.load(f)
            except (json.JSONDecodeError, IOError):
                print(f"Warning: Could not load verification cache from {self.cache_file}")
        
        # Precompile regex for sentence splitting
        self.sentence_splitter = re.compile(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s')
        
        # URL extraction pattern
        self.url_pattern = re.compile(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[-\w.]*([/?#]|(?:\?[-\w.&=-]*))')
        
    def _generate_cache_key(self, text: str) -> str:
        """Generate a unique cache key for a piece of text"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()
    
    def _save_cache(self) -> None:
        """Save verification cache to disk"""
        if self.cache_file:
            try:
                with open(self.cache_file, 'w') as f:
                    json.dump(self._verification_cache, f)
            except IOError:
                print(f"Warning: Could not save verification cache to {self.cache_file}")
    
    @lru_cache(maxsize=1000)
    def is_trusted_filename(self, filename: str) -> Tuple[bool, float]:
        """
        Check if the filename indicates a trusted source.
        
        Args:
            filename: The filename to check
            
        Returns:
            Tuple of (is_trusted, confidence_score)
        """
        filename_lower = filename.lower()
        
        # Check for trusted organization names in filename
        for org in self.trusted_organizations:
            if org in filename_lower:
                return True, 0.8
        
        # Check for medical credentials or verification terms
        verification_terms = {"verified", "certified", "approved", "reviewed", "clinical", "evidence"}
        medical_terms = {"doctor", "md_", "physician", "medical"}
        
        has_medical = any(term in filename_lower for term in medical_terms)
        has_verification = any(term in filename_lower for term in verification_terms)
        
        if has_medical and has_verification:
            return True, 0.7
        elif has_medical:
            return True, 0.5
        elif has_verification:
            return True, 0.4
            
        return False, 0.0
    
    def extract_urls(self, text: str) -> List[str]:
        """Extract URLs from text that might point to sources"""
        return self.url_pattern.findall(text)
    
    def is_trusted_domain(self, url: str) -> bool:
        """Check if URL is from a trusted medical domain"""
        try:
            domain = urlparse(url).netloc.lower()
            # Check direct match
            if domain in self.trusted_domains:
                return True
                
            # Check for subdomains of trusted domains
            for trusted in self.trusted_domains:
                if domain.endswith('.' + trusted):
                    return True
        except:
            pass
        return False
    
    def extract_verification_sources(self, text: str) -> List[VerificationSource]:
        """
        Extract detailed verification information from text.
        
        Args:
            text: The text to analyze
            
        Returns:
            List of structured VerificationSource objects
        """
        sources = []
        
        # Check for explicit patterns with type information
        for pattern, info in self.verification_patterns:
            matches = pattern.finditer(text)
            for match in matches:
                source = VerificationSource(
                    type=info["type"],
                    verification_method=match.group(1) if match.lastindex >= 1 else None,
                    name=match.group(2) if match.lastindex >= 2 else None
                )
                
                # For organization matches, set organization name
                if info["type"] == "organization" and source.name:
                    source.organization = source.name
                    source.name = None
                
                sources.append(source)
        
        # Extract URLs that might be references
        urls = self.extract_urls(text)
        for url in urls:
            if self.is_trusted_domain(url):
                # Extract organization from domain
                domain = urlparse(url).netloc.lower()
                org = next((trusted for trusted in self.trusted_organizations 
                          if trusted in domain), "medical website")
                
                sources.append(VerificationSource(
                    type="website",
                    organization=org.title(),
                    url=url
                ))
        
        return sources
    
    def analyze_verification(self, text: str) -> Dict[str, Any]:
        """
        Comprehensive analysis of verification signals in text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with verification analysis
        """
        # Check cache first
        cache_key = self._generate_cache_key(text)
        if cache_key in self._verification_cache:
            return self._verification_cache[cache_key]
        
        # Detailed analysis
        result = {
            "verified": False,
            "confidence": 0.0,
            "sources": [],
            "indicators": [],
            "has_trusted_urls": False,
            "has_medical_organization": False,
            "has_physician": False
        }
        
        # Extract verification sources
        verification_sources = self.extract_verification_sources(text)
        if verification_sources:
            result["sources"] = [source.to_dict() for source in verification_sources]
            result["verified"] = True
            
            # Check for specific verification types
            source_types = [source.type for source in verification_sources]
            result["has_physician"] = "physician" in source_types
            result["has_medical_organization"] = "organization" in source_types
            
            # Calculate confidence based on source types
            confidence_values = []
            for source in verification_sources:
                if source.type == "organization":
                    confidence_values.append(1.0)  # Highest confidence
                elif source.type == "physician":
                    confidence_values.append(0.9)
                elif source.type == "journal":
                    confidence_values.append(0.9)
                elif source.type == "specialist":
                    confidence_values.append(0.8)
                elif source.type == "website" and self.is_trusted_domain(source.url or ""):
                    confidence_values.append(0.7)
                else:
                    confidence_values.append(0.5)
            
            if confidence_values:
                result["confidence"] = max(confidence_values)
        
        # Check for verification indicator phrases
        text_lower = text.lower()
        found_indicators = []
        for indicator, confidence in self.verification_indicators.items():
            if indicator in text_lower:
                found_indicators.append({"term": indicator, "confidence": confidence})
                result["verified"] = True
                
        if found_indicators:
            result["indicators"] = found_indicators
            # Update confidence if indicator confidence is higher
            indicator_confidence = max([i["confidence"] for i in found_indicators], default=0)
            result["confidence"] = max(result["confidence"], indicator_confidence)
        
        # Extract URLs and check against trusted domains
        urls = self.extract_urls(text)
        trusted_urls = [url for url in urls if self.is_trusted_domain(url)]
        if trusted_urls:
            result["has_trusted_urls"] = True
            result["trusted_urls"] = trusted_urls
            result["verified"] = True
            # If no higher confidence sources, use this confidence
            if result["confidence"] < 0.7:
                result["confidence"] = 0.7
        
        # Cache the result
        self._verification_cache[cache_key] = result
        self._save_cache()
        
        return result
    
    def analyze_document_verification(self, doc: Document) -> Dict[str, Any]:
        """
        Perform multi-layer verification analysis on a document.
        
        Args:
            doc: The document to analyze
            
        Returns:
            Verification analysis results
        """
        # Start with checking filename/source
        source = doc.metadata.get("source", "")
        trusted_filename, filename_confidence = self.is_trusted_filename(source)
        
        # Analyze text content
        text_analysis = self.analyze_verification(doc.page_content)
        
        # Extract metadata verification if available
        metadata_verified = False
        metadata_confidence = 0.0
        
        # Check for verification metadata
        for key in ["verified", "verified_by", "peer_reviewed", "reviewer", "author", "publisher"]:
            if key in doc.metadata and doc.metadata[key]:
                metadata_verified = True
                # Check confidence based on the type of verification
                if key in ["verified_by", "reviewer"] and any(cred in str(doc.metadata[key]).lower() 
                                                           for cred in self.medical_credentials):
                    metadata_confidence = 0.9
                elif key == "publisher" and any(org in str(doc.metadata[key]).lower() 
                                              for org in self.trusted_organizations):
                    metadata_confidence = 0.9
                elif key == "peer_reviewed" and doc.metadata[key]:
                    metadata_confidence = 0.8
                else:
                    metadata_confidence = 0.6
        
        # Combine verification signals with weighting
        is_verified = text_analysis["verified"] or trusted_filename or metadata_verified
        
        # Calculate overall confidence - highest confidence from any method gets priority
        confidence_scores = [
            text_analysis["confidence"],
            filename_confidence,
            metadata_confidence
        ]
        overall_confidence = max(confidence_scores) if confidence_scores else 0.0
        
        # Combine results
        return {
            "verified": is_verified,
            "confidence": overall_confidence,
            "content_verification": text_analysis,
            "filename_verified": trusted_filename,
            "filename_confidence": filename_confidence,
            "metadata_verified": metadata_verified,
            "metadata_confidence": metadata_confidence,
            "verification_date": datetime.datetime.now().isoformat()
        }
    
    def batch_analyze_verification(self, docs: List[Document]) -> List[Dict[str, Any]]:
        """
        Analyze multiple documents for verification in batch.
        Returns:
            List of verification analysis results
        """
        return [self.analyze_document_verification(doc) for doc in docs]
    
    def format_verified_response(self, answer: str, chunks: List[Document]) -> Dict[str, Any]:
        """
        Format a response with granular verification markers and confidence scores.
        
        Args:
            answer: The answer text
            chunks: The source document chunks
            
        Returns:
            Enhanced response with verification details
        """
        # Process chunks and collect verification info
        verification_results = []
        verified_chunks = []
        high_confidence_chunks = []
        verification_sources = []
        confidence_scores = []
        
        for chunk in chunks:
            # Check metadata for existing verification analysis
            if "verification_analysis" in chunk.metadata:
                verification = chunk.metadata["verification_analysis"]
            else:
                verification = self.analyze_document_verification(chunk)
            
            verification_results.append(verification)
            confidence_scores.append(verification["confidence"])
            
            if verification["verified"]:
                verified_chunks.append(chunk)
                
                # Extract sources from content verification
                if "sources" in verification["content_verification"]:
                    verification_sources.extend(verification["content_verification"]["sources"])
                
                # Track highly confident chunks
                if verification["confidence"] >= 0.8:
                    high_confidence_chunks.append(chunk)
        
        has_verified_info = len(verified_chunks) > 0
        has_high_confidence = len(high_confidence_chunks) > 0
        mean_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        max_confidence = max(confidence_scores) if confidence_scores else 0
        
        # Deduplicate sources
        unique_sources = []
        seen_sources = set()
        for source in verification_sources:
            source_key = json.dumps(source, sort_keys=True)
            if source_key not in seen_sources:
                unique_sources.append(source)
                seen_sources.add(source_key)
        
        # Early return if no verification
        if not has_verified_info:
            return {
                "answer": answer,
                "has_verified_info": False,
                "verification_details": None,
                "verification_confidence": 0.0,
                "verified_chunk_count": 0,
                "total_chunk_count": len(chunks)
            }
        
        # Extract sentences from verified chunks
        verified_sentences = []
        for chunk in verified_chunks:
            # Split into sentences
            sentences = self.sentence_splitter.split(chunk.page_content)
            for sentence in sentences:
                cleaned = sentence.strip()
                if len(cleaned) > 10:  # Skip very short fragments
                    # Get the verification confidence for this chunk
                    confidence = next((v["confidence"] for v in verification_results 
                                      if chunk.page_content == v.get("analyzed_text", "")), 0.5)
                    verified_sentences.append((cleaned, confidence))
        
        # Process the answer with confidence-based markers
        sentences = self.sentence_splitter.split(answer)
        marked_sentences = []
        
        # Normalize sentences for comparison
        normalized_verified = [(self._normalize_text(s), conf) for s, conf in verified_sentences]
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # Find best matching verified sentence and confidence
            best_match = None
            best_score = 0
            best_confidence = 0
            
            normalized_sentence = self._normalize_text(sentence)
            
            for i, (norm_verified, confidence) in enumerate(normalized_verified):
                similarity = self._calculate_similarity(normalized_sentence, norm_verified)
                if similarity > best_score:
                    best_score = similarity
                    best_match = verified_sentences[i][0]
                    best_confidence = confidence
            
            # Apply verification markers based on confidence and similarity
            if best_score > 0.7:  # Good match threshold
                if best_confidence >= 0.9:  # Highest confidence
                    marked_sentences.append(f"⚕️⚕️⚕️ [VERIFIED HIGH CONFIDENCE] {sentence}")
                elif best_confidence >= 0.7:  # Medium confidence
                    marked_sentences.append(f"⚕️⚕️ [VERIFIED] {sentence}")
                else:  # Lower confidence
                    marked_sentences.append(f"⚕️ [PARTIALLY VERIFIED] {sentence}")
            else:
                marked_sentences.append(sentence)
        
        reformulated_answer = " ".join(marked_sentences)
        
        # Generate verification footer based on sources
        if unique_sources:
            # Group sources by type
            sources_by_type = {}
            for source in unique_sources:
                source_type = source.get("type", "other")
                if source_type not in sources_by_type:
                    sources_by_type[source_type] = []
                sources_by_type[source_type].append(source)
            
            # Format footer based on source types
            footer_parts = []
            
            if "organization" in sources_by_type:
                orgs = [s.get("organization", "Medical Organization") for s in sources_by_type["organization"]]
                footer_parts.append(f"Organizations: {', '.join(orgs)}")
                
            if "physician" in sources_by_type:
                physicians = [s.get("name", "Medical Professional") for s in sources_by_type["physician"]]
                footer_parts.append(f"Medical professionals: {len(physicians)}")
                
            if "journal" in sources_by_type:
                journals = [s.get("name", "Medical Journal") for s in sources_by_type["journal"]]
                footer_parts.append(f"Medical journals: {', '.join(journals)}")
            
            verification_footer = "\n\n[Information verified by " + "; ".join(footer_parts) + "]"
            
            # Add confidence level
            if max_confidence >= 0.9:
                verification_footer += "\n[High confidence in verification]"
            elif max_confidence >= 0.7:
                verification_footer += "\n[Medium confidence in verification]"
            else:
                verification_footer += "\n[Limited confidence in verification]"
                
        else:
            verification_footer = "\n\n[Information includes content from verified medical sources]"
            
            if mean_confidence >= 0.7:
                verification_footer += "\n[Medium to high confidence in verification]"
            else:
                verification_footer += "\n[Limited confidence in verification]"
        
        reformulated_answer += verification_footer
        
        return {
            "answer": reformulated_answer,
            "has_verified_info": has_verified_info,
            "has_high_confidence_verification": has_high_confidence,
            "verification_confidence": max_confidence,
            "mean_verification_confidence": mean_confidence,
            "sources": unique_sources,
            "verified_chunk_count": len(verified_chunks),
            "high_confidence_chunk_count": len(high_confidence_chunks),
            "total_chunk_count": len(chunks),
            "verification_timestamp": datetime.datetime.now().isoformat()
        }
    
    @staticmethod
    @lru_cache(maxsize=1000)
    def _normalize_text(text: str) -> str:
        """Normalize text for comparison (cached for efficiency)"""
        return re.sub(r'[^\w\s]', '', text.lower())
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between normalized texts with multiple metrics.
        
        Args:
            text1: First normalized text
            text2: Second normalized text
            
        Returns:
            Similarity score from 0 to 1
        """
        # Convert to word sets for comparison
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        # Handle empty texts
        if not words1 or not words2:
            return 0
            
        # Calculate Jaccard similarity (intersection over union)
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        jaccard = intersection / union if union > 0 else 0
        
        # Calculate Overlap coefficient (intersection over smaller set)
        min_size = min(len(words1), len(words2))
        overlap = intersection / min_size if min_size > 0 else 0
        
        # Calculate weighted score with higher weight for overlap
        # This favors situations where one text is a subset of the other
        return (overlap * 0.7) + (jaccard * 0.3)