import os
from datetime import datetime, timedelta
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from typing import List, Set, Tuple, Dict

import spacy
import nltk
from collections import Counter
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Load spaCy NLP model
nlp = spacy.load("en_core_web_sm")

# Download NLTK stopwords
nltk.download("stopwords")
nltk.download("punkt")

# Get standard stopwords from NLTK
nltk_stopwords = set(stopwords.words("english"))

def _compute_tf_idf(corpus):
    """Compute term frequency across a given corpus to dynamically detect low-value words."""
    word_counts = Counter()

    # Tokenize words and count occurrences
    for text in corpus:
        tokens = [word.lower() for word in word_tokenize(text) if word.isalnum()]
        word_counts.update(tokens)

    # Normalize frequency scores
    total_words = sum(word_counts.values())
    tf_scores = {word: count / total_words for word, count in word_counts.items()}

    return tf_scores


def _remove_filler_words_helper(text, corpus=None):
    """
    Removes filler words, stopwords, and contextually unimportant words while preserving key context.

    Args:
        text: Input text to process.
        corpus: Optional corpus for computing dynamic stopwords.

    Returns:
        Processed text with only contextually important words.
    """
    if not text:
        return ""

    doc = nlp(text)
    filtered_tokens = []

    # Compute dynamic stopwords from corpus (if available)
    dynamic_stopwords = set()
    if corpus:
        tf_scores = _compute_tf_idf(corpus)
        dynamic_stopwords = {word for word, score in tf_scores.items() if score < 0.01}  # Low-value words

    for token in doc:
        # Preserve Named Entities (Proper Nouns, Locations, Organizations)
        if token.ent_type_:
            filtered_tokens.append(token.text)
            continue

        # Preserve only strong content words (Nouns, Verbs, Adjectives, Adverbs)
        if token.pos_ in {"NOUN", "VERB", "ADJ", "ADV"}:
            # Remove stopwords and dynamically low-value words
            if token.text.lower() in nltk_stopwords or token.text.lower() in dynamic_stopwords:
                continue
            filtered_tokens.append(token.text)

    return " ".join(filtered_tokens)


def remove_filler_words(text: str) -> str:
    return _remove_filler_words_helper(text)
    