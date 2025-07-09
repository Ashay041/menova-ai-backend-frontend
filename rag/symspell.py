import collections
from typing import Set, Dict, List, Tuple, Optional
import spacy

class TextPreprocessor:
    """
    This class tokenizes input text, filters out filler words using a merged stopword set,
    and retains only tokens whose part-of-speech is in an allowed set. Optionally, it
    normalizes tokens via lemmatization.
    
    Attributes:
        min_length (int): Minimum length required for tokens.
        use_lemmatization (bool): Whether tokens are lemmatized.
        nlp (spacy.language.Language): The spaCy language model used for processing.
    """
    
    def __init__(
        self,
        min_length: int = 3,
        use_lemmatization: bool = True,
        nlp: Optional[spacy.language.Language] = None,
    ) -> None:
        """
        Initializes the preprocessor.
        """
        self.min_length = min_length
        self.use_lemmatization = use_lemmatization
        self.nlp = nlp if nlp is not None else spacy.load("en_core_web_sm")
        default_stopwords = self.nlp.Defaults.stop_words
        self.custom_stopwords = set()
        self.stopwords: Set[str] = default_stopwords.union(self.custom_stopwords)
        self.allowed_pos: Set[str] = {"NOUN", "PROPN", "ADJ"}
    
    def tokenize_and_filter(self, text: str) -> List[str]:
        """
        Processes input text and returns a list of filtered tokens.
        
        """
        doc = self.nlp(text)
        filtered_tokens: List[str] = []
        for token in doc:
            if not token.is_alpha:
                continue
            token_text = token.text.lower()
            if token_text in self.stopwords:
                continue
            if token.pos_ not in self.allowed_pos:
                continue
            normalized_token = token.lemma_.lower() if self.use_lemmatization else token_text
            if len(normalized_token) < self.min_length:
                continue
            filtered_tokens.append(normalized_token)
        return filtered_tokens
    


class SymSpell:
    """
    A SymSpell implementation that precomputes deletion (delete‑edit) variants for a
    fixed vocabulary and uses them for fast fuzzy lookup using a hash‑table.
    """

    def __init__(self, vocabulary: Set[str], max_edit_distance: int = 2) -> None:
        """
        Initialize the SymSpell object.
        """
        self.max_edit_distance = max_edit_distance
        self.vocabulary = vocabulary
        self.deletion_dict: Dict[str, Set[str]] = collections.defaultdict(set)
        self._build_deletion_dict()

    def _build_deletion_dict(self) -> None:
        """
        Build a mapping from each deletion variant (up to max_edit_distance deletions)
        of every word to the original words. Also maps the word itself.
        """
        for word in self.vocabulary:
            self.deletion_dict[word].add(word)
            for deletion in self._generate_deletes(word, self.max_edit_distance):
                self.deletion_dict[deletion].add(word)

    @staticmethod
    def _generate_deletes(word: str, max_edit_distance: int) -> Set[str]:
        """
        Generate all deletion variants of a word with up to max_edit_distance deletions.

        :param word: The input word.
        :param max_edit_distance: Maximum number of deletions allowed.
        :return: A set of deletion variants.
        """
        deletes: Set[str] = set()

        def helper(current_word: str, distance: int) -> None:
            if distance == 0:
                return
            for i in range(len(current_word)):
                deletion = current_word[:i] + current_word[i+1:]
                if deletion not in deletes:
                    deletes.add(deletion)
                    helper(deletion, distance - 1)

        helper(word, max_edit_distance)
        return deletes

    @staticmethod
    def _levenshtein_distance(s: str, t: str) -> int:
        """
        Compute the Levenshtein (edit) distance between two strings.

        :param s: The first string.
        :param t: The second string.
        :return: The edit distance.
        """
        if s == t:
            return 0
        if len(s) == 0:
            return len(t)
        if len(t) == 0:
            return len(s)

        dp = [[0] * (len(t) + 1) for _ in range(len(s) + 1)]
        for i in range(len(s) + 1):
            dp[i][0] = i
        for j in range(len(t) + 1):
            dp[0][j] = j

        for i in range(1, len(s) + 1):
            for j in range(1, len(t) + 1):
                cost = 0 if s[i - 1] == t[j - 1] else 1
                dp[i][j] = min(
                    dp[i - 1][j] + 1,        # deletion
                    dp[i][j - 1] + 1,        # insertion
                    dp[i - 1][j - 1] + cost  # substitution
                )
        return dp[len(s)][len(t)]

    def lookup(self, query: str) -> List[Tuple[str, int]]:
        """
        Look up the query word and return a list of candidates as tuples
        (candidate, edit_distance) for those within max_edit_distance.

        :param query: The query word.
        :return: A list of candidate words with their edit distances.
        """
        candidates: Set[str] = set()

        # Include the query if an exact match exists.
        if query in self.vocabulary:
            candidates.add(query)

        # Generate deletion variants for the query and fetch candidates.
        query_deletes = self._generate_deletes(query, self.max_edit_distance)
        for deletion in query_deletes:
            if deletion in self.deletion_dict:
                candidates.update(self.deletion_dict[deletion])

        suggestions: List[Tuple[str, int]] = []
        for candidate in candidates:
            d = self._levenshtein_distance(query, candidate)
            if d <= self.max_edit_distance:
                suggestions.append((candidate, d))

        suggestions.sort(key=lambda x: (x[1], x[0]))  # sort by distance then lexically
        return suggestions


class MedicalTermExtractor:
    """
    A spell checker specialized for medical vocabulary. This class performs
    fuzzy matching using a SymSpell instance and maps recognized acronyms to their full forms.
    """

    def __init__(self, vocabulary: Set[str], acronym_mapping: Dict[str, str], max_edit_distance: int = 1) -> None:
        """
        Initialize the MedcialTermExtractor.

        :param vocabulary: A set of valid medical words.
        :param acronym_mapping: A dictionary mapping acronyms (lowercase) to full forms.
        :param max_edit_distance: Maximum allowed edit distance.
        """
        self.symspell = SymSpell(vocabulary, max_edit_distance)
        self.acronym_mapping: Dict[str, str] = {k.lower(): v for k, v in acronym_mapping.items()}
        self.preprocessor = TextPreprocessor(
            min_length=3,
            use_lemmatization=True,
        )
    

    def lookup(self, query: str) -> List[Tuple[str, int]]:
        """
        For a given input word, if it is a recognized acronym, return its full form.
        Otherwise, perform a fuzzy lookup.
        """
        lower_query = query.lower()
        processed_tokens = self.preprocessor.tokenize_and_filter(lower_query)
        for token in processed_tokens:
            res = self.symspell.lookup(token)
            if len(res) > 0:
                return True
        return False

