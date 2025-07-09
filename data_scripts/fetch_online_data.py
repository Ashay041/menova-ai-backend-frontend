import os
import requests
from bs4 import BeautifulSoup
import re
import nltk
import xml.etree.ElementTree as ET
import io
from dotenv import load_dotenv


class DocumentFetcher:
    def __init__(self, min_results = 100):
        load_dotenv()
        self.BING_ENDPOINT = "https://api.bing.microsoft.com/"
        self.GOOGLE_ENDPOINT = "https://www.googleapis.com/customsearch/v1"
        self.WIKIPEDIA_ENDPOINT = "https://en.wikipedia.org/w/api.php"
        self.MEDLINE_ENDPOINT = "https://wsearch.nlm.nih.gov/ws/query"

        self.BING_API_KEY = os.getenv("BING_API_KEY")
        self.GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
        self.GOOGLE_CX = os.getenv("GOOGLE_CX")

        self.trusted_sites = []

        self.min_results = min_results


    def bing_search(self, query):

        headers = {"Ocp-Apim-Subscription-Key": self.BING_API_KEY}
        params = {
            "q":f"{query} site:pubmed.ncbi.nlm.nih.gov OR site:who.int OR site:cdc.gov",
            "count": 5
        }
        try:
            response = requests.get(self.BING_ENDPOINT, headers=headers, params=params)
            response.raise_for_status()
            results = response.json()
        except Exception as e:
            print(f"Error fetching results: {e}")
            return []

        docs = [result['snippet'] for result in results.get("webPages", {}).get("value", [])]

        paragraphs = []
        for doc in docs:
            paragraphs.extend(doc.split("\n\n"))

        return paragraphs


    def get_medlineplus_data(self, query):
        params = {
            'db': 'healthTopics',
            'term': query,
            'retmax': 30,
            'rettype': 'brief',
            'sort': 'relevance'
        }
        try:
            response = requests.get(self.MEDLINE_ENDPOINT, params=params)
            response.raise_for_status()
            data = response.text  # XML response
            # print(data)

            final_text = []

            with io.StringIO(data) as f:
                tree = ET.parse(f)
                root = tree.getroot()

                for document in root.findall(".//document"):
                    full_summary = document.find(".//content[@name='FullSummary']")
                    if full_summary is not None:
                        input_text = full_summary.text
                        soup = BeautifulSoup(input_text, 'html.parser')
                        cleaned_text = soup.get_text()

                        sentences = re.split(r'(?<!\w\.\w)(?<=\.|\?)\s', cleaned_text)

                        filtered_sentences = set([sentence for sentence in sentences if '?' not in sentence])
                        final_text.extend(list(filtered_sentences))

            return final_text

        except Exception as e:
            print(f"Error fetching data from MedlinePlus: {e}")
            return None


    def google_custom_search(self, query):
        params = {
            "key": self.GOOGLE_API_KEY,
            "cx": self.GOOGLE_CX,
            "q": query,
            "num": 15
        }

        trusted_pages = [
            f"https://www.mayoclinic.org/",
            f"https://www.webmd.com/",
            f"https://www.cdc.gov/",
            f"https://www.who.int/",
            f"https://www.nih.gov/",
            f"https://www.nlm.nih.gov/",
            f"https://www.ncbi.nlm.nih.gov/",
            f"https://www.niddk.nih.gov/",
            f"https://www.fda.gov/",
            f"https://www.aafa.org/",
            f"https://www.cancer.gov/",
            f"https://www.heart.org/",
        ]

        try:
            response = requests.get(self.GOOGLE_ENDPOINT, params=params)
            response.raise_for_status()
            results = response.json()

        except requests.exceptions.RequestException as e:
            print(f"Error fetching Google Search results: {e}")
            print(f"Google Error: {e}")
            return []

        docs = [(result['snippet'], result['link']) for result in results.get("items", [])]

        paragraphs = []
        for doc in docs:
            print(doc[1])
            if any(url in doc[1] for url in trusted_pages):
                self.trusted_sites.append(doc[1])

        return self.scrape_data()


    def get_wikipedia_page_content(self, query):
        params = {
            "action": "query",
            "format": "json",
            "titles": query,
            "prop": "extracts",
            # "rvprop": "content",  # Full content of the page
            "explaintext": True,   # Exclude any HTML and media content
        }

        response = requests.get(self.WIKIPEDIA_ENDPOINT, params=params)
        data = response.json()

        pages = data.get("query", {}).get("pages", {})
        page = next(iter(pages.values()), None)

        if page and "extract" in page:
            text = page["extract"]
            text = re.sub(r'\[\d+\]', '', text)
            text = re.sub(r'\b(?:doi|PMID|S2CID)[^a-zA-Z0-9]*\d+', '', text)
            text = re.sub(r"\[.*?\]", "", text)
            text = re.sub(r"==.*?==", "", text)
            text = re.sub(r'https?://\S+', '', text)
            text = re.sub(r'[A-Za-z]+ [A-Za-z]+ \(.*\)\. [\w\s\.,:;]+(?:\s+doi[:/.\w]+)?', '', text)
            text = re.sub(r'\s+', ' ', text).strip()
            return nltk.sent_tokenize(text)
        else:
            print(f"No wikipedia information found for {query}.")
            return ""


    def get_wikipedia_data(self, query):
        search_params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": query
        }

        search_response = requests.get(self.WIKIPEDIA_ENDPOINT, params=search_params)
        search_results = search_response.json()

        wikipedia_data = []

        if "query" in search_results and "search" in search_results["query"]:
            for result in search_results["query"]["search"]:
                page_title = result["title"]
                wikipedia_data.extend(self.get_wikipedia_page_content(page_title))

        return wikipedia_data


    def scrape_data(self):
        reliable_domains = [".gov", "mayo", "webmd", "None", ".cdc", ".nih", "fda"]

        extracted_content = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        for url in self.trusted_sites:
            try:
                response = requests.get(url, headers = headers)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, "html.parser")
                paragraphs = soup.find_all("p")

                for p in paragraphs:
                    text = p.get_text()
                    if text != None:
                        text = text.strip()
                        sentences = nltk.sent_tokenize(text)
                        for sentence in sentences:
                          if not any(keyword.lower() in text.lower() for keyword in reliable_domains):
                              extracted_content.append(sentence)

            except Exception as e:
                print(f"Error fetching data from {url}: {e}")


        return extracted_content

    def fetch_all_data(self, query):
        # cached_results = self.load_cached_results(query)
        # if cached_results:
        #     print("[Cache Hit] Using cached results.")
        #     return cached_results
        # else:
        #     print("[Cache Miss] Fetching new results.")

        all_data = []
        all_data.extend(self.get_wikipedia_data(query))
        all_data.extend(self.get_medlineplus_data(query))

        if len(all_data) < self.min_results:
            all_data.extend(self.google_custom_search(query))

        all_data = " ".join([str(item) for item in all_data if item])

        # self.cache_results(query, all_data)

        return all_data
    

if __name__ == "__main__":
    fetcher = DocumentFetcher(500)
    query = ["menopause", "perimanopause"]
    for q in query:
        print(f"Fetching data for query: {q}")
        results = fetcher.fetch_all_data(q)
        ## chunk data and store
    