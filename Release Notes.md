# Pre-Production

### March 11th
- added conversationMemoryBuffer to RAG
- Added code to verify user responses (verification.py)
- refactored code to separate classes

### March 14th
- integrate hybrid retrieval (rrf + pinecone) ranking (ranking.py)
- flush memories based on time stamp (utils.py)
- changed 2 prompts to 1 prompt in execute_query rag main
- remove filler words (utils.py)
- Document Fetcher (medlineplus api + wikipedia + google search engine) (document_fetching_apis.py)
- umls code + fuzzy trie add to repo (medical_terms.py)