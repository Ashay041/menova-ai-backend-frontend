import requests
import json
import re
import os
import pickle
import csv
from langdetect import detect
import spacy
from dotenv import load_dotenv

nlp = spacy.load("en_core_web_sm")

class UMLSConnector:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("UMLS_API_KEY")
        self.base_url = "https://uts-ws.nlm.nih.gov/rest"
        self.version = 'current'
        self.words = set()


    def tokenize_words(self, text):
        try:
            if detect(text) != "en":  # Only keep English
                return []
        except:
            return []  # Language detection failure, skip

        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        doc = nlp(text)

        tokens = []
        for token in doc:
            if token.is_stop or token.is_digit or not token.is_alpha:
                continue
            if len(token.text) <= 2:
                continue
            if token.pos_ in ["NOUN", "PROPN"]:  # Medical terms often are nouns
                tokens.append(token.text)

        return tokens


    def search_terms(self, term):
        search_endpoint = f'{self.base_url}/search/{self.version}'

        params = {
            'string': {term},
            # 'searchType': 'exact',
            'semanticType':'T121%T200%T047',
            'returnIdType': 'concept',
            'pageSize': 100,
            'apiKey': self.api_key
        }

        response = requests.get(search_endpoint, params=params)

        if response.status_code != 200:
            print(f"Error: API request failed with status code {response.status_code}")
            print(f"Response content: {response.content}")
            return None

        results = response.json()

        if not results or 'result' not in results:
            print("404 search")
            return None

        cui = None
        if 'results' in results['result'] and len(results['result']['results']) > 0 and 'ui' in results['result']['results'][0]:
            cui = results['result']['results'][0]['ui']

        for result in results['result']['results']:
            if 'name' not in result:
                continue
            tokens = self.tokenize_words(result['name'].encode('utf-8').decode('unicode_escape'))
            for token in tokens:
                if token.isascii() and len(token) < 18:
                    self.words.add(token)

        return cui


    def search_relationships(self, term, cui):
        search_endpoint = f'{self.base_url}/content/{self.version}/CUI/{cui}/relations?rela=RO&apiKey={self.api_key}'

        params = {
            # 'string': {term},
            # 'searchType': 'exact',
            'returnIdType': 'concept',
            'pageSize': 100,
            'apiKey': self.api_key
        }

        response = requests.get(search_endpoint)

        if response.status_code != 200:
            print(f"Error: API request failed with status code {response.status_code}")
            print(f"Response content: {response.content}")
            return None

        results = response.json()

        if not results or 'result' not in results:
            print("404 relationships")
            return None

        for result in results['result']:
            if 'relatedIdName' not in result:
                continue
            tokens = self.tokenize_words(result['relatedIdName'])
            for token in tokens:
                if token.isascii() and len(token) < 18:
                    self.words.add(token)


        # print(self.words)

class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False


class FuzzyTrie:
    def __init__(self, max_errors):
        self.root = TrieNode()
        self.max_errors = max_errors
        self.filler_words = [
          'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for',
          'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or',
          'such', 'that', 'the', 'then', 'there', 'these',
          'this', 'to', 'was', 'will', 'with', 'about', 'above', 'after',
          'again', 'all', 'any', 'because', 'been', 'before',
          'below', 'between', 'both', 'down', 'during', 'each',
          'few', 'from', 'further','if', 'into', 'just', 'more', 'most', 'only', 'other', 'out',
          'over', 'same', 'so', 'some', 'than','under', 'until', 'up', 'very', 'what',
          'which', 'while', 'why', 'with'
      ]


    def save_trie(self, file_name = "trie.pkl"):
        with open(file_name, 'wb') as f:
            pickle.dump(self, f)


    def insert(self, word: str):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_word = True


    def dfs(self, node, target, index, current, results, errors, memo):
        if errors > self.max_errors:
            return

        state = (node, index, errors)
        if state in memo:
            return

        memo[state] = True

        if index == len(target):
            if node.is_word:
                results.add(current)
            return

        ch = target[index]

        # Substitution
        for key in node.children:
            self.dfs(node.children[key], target, index + 1, current + key, results, errors + (0 if key == ch else 1), memo)

        # Deletion
        self.dfs(node, target, index + 1, current, results, errors + 1, memo)

        # Insertion
        for key in node.children:
            self.dfs(node.children[key], target, index, current + key, results, errors + 1, memo)


    def search_with_errors(self, target_terms):
        results = set()

        for target in target_terms:
            memo = {}
            self.dfs(self.root, target, 0, "", results, 0, memo)
        return list(results)


    def load_from_api(self, keywords):
        umls = UMLSConnector()
        if not os.path.exists(f'Data/UMLS/menopause_terms2.json'):
            for keyword in keywords:
                cui = umls.search_terms(keyword)
                if cui != None:
                    umls.search_relationships(keyword, cui)

            with open(f'Data/UMLS/menopause_terms.json', 'w') as file:
                json.dump(list(umls.words), file, ensure_ascii=False)

            for term in umls.words:
                self.insert(term)

        else:
            with open(f'Data/UMLS/menopause_terms.json', 'r') as file:
                search_terms = json.load(file)

            for term in search_terms:
                self.insert(term)


    def load_from_csv(self, csv_file: str):
        with open(csv_file, 'r') as file:
            reader = csv.reader(file)
            for row in reader:
                if row:  # Avoid empty rows
                    self.insert(row[0])



if __name__ == "__main__":
    keywords = [
    # Core Menopause Stages
    "menopause", "perimenopause", "premenopause", "postmenopause", "climacteric", 
    "reproductive aging", "ovarian aging", "early menopause", "surgical menopause", 
    "premature ovarian failure", "primary ovarian insufficiency", "menstrual irregularity", 
    "cessation of menstruation", "irregular periods",

    # Hormonal Concepts
    "estrogen", "estradiol", "estriol", "progesterone", "testosterone", "androgens", 
    "FSH", "LH", "gonadotropins", "hormone imbalance", "hypoestrogenism", "low estrogen", 
    "high FSH", "hormonal changes", "hormone deficiency",

    # Symptoms (Physical & Emotional)
    "hot flashes", "night sweats", "vaginal dryness", "low libido", "painful intercourse", 
    "irritability", "mood swings", "depression", "anxiety", "fatigue", "insomnia", 
    "sleep disturbances", "brain fog", "memory loss", "difficulty concentrating", 
    "palpitations", "joint pain", "headaches", "migraine", "weight gain", 
    "bloating", "breast tenderness", "dry skin", "hair thinning", "itching", "urinary urgency", 
    "urinary tract infections", "incontinence", "body odor changes", "dizziness", 
    "restlessness", "tingling sensations", "numbness", "chills", "crying spells",

    # Comorbid Conditions
    "osteoporosis", "osteopenia", "cardiovascular disease", "hypertension", 
    "hyperlipidemia", "diabetes", "metabolic syndrome", "thyroid disorder", 
    "hypothyroidism", "hyperthyroidism", "breast cancer", "PCOS", "infertility",

    # Treatments & Therapies
    "HRT", "hormone replacement therapy", "MHT", "menopausal hormone therapy", 
    "bioidentical hormones", "vaginal estrogen", "topical estrogen", "SSRIs", "SNRIs", 
    "gabapentin", "clonidine", "non-hormonal therapy", "black cohosh", "soy isoflavones", 
    "natural remedies", "lifestyle changes", "dietary supplements", "calcium", "vitamin D", 
    "weight loss", "exercise therapy", "CBT", "pelvic floor therapy",

    # Diagnostics & Lab Tests
    "FSH test", "estradiol test", "hormone panel", "thyroid panel", "bone density test", 
    "DEXA scan", "lipid panel", "blood sugar", "AMH test", "prolactin test", 
    "pelvic ultrasound",

    # Broader Patient Concerns
    "aging", "sexual health", "menopause and sex", "skin aging", "hair loss", 
    "mental health", "relationship issues", "self-image", "confidence", 
    "body changes", "sleep hygiene", "supplement safety", "alternative medicine"
    ]

    
    keywords = [keyword.lower() for keyword in keywords]
    trie_path = f'menopause_terms.pkl'

#   if os.path.exists(trie_path):
    #   with open(trie_path, 'rb') as f:
    #       trie = pickle.load(f)
    # pass
#   else:
    trie = FuzzyTrie(1)

    trie.load_from_api(keywords)
    trie.save_trie(trie_path)
    print(f'Created New Trie')