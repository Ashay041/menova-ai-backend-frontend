from pymongo.mongo_client import MongoClient
from dotenv import load_dotenv
import urllib
import os


load_dotenv()

def initialize_database(client):
    """Initialize all collections and their indexes in the database"""
    db = client['menova_main']
    
    # User credentials collection
    if 'credentials' not in db.list_collection_names():
        db.create_collection('credentials')
    credentials = db['credentials']
    credentials.create_index("user_id", unique=True)
    credentials.create_index("user_email", unique=True)

    # AI summary collection
    if 'ai_summary' not in db.list_collection_names():
        db.create_collection('ai_summary')
    ai_summary = db['ai_summary']
    ai_summary.create_index("user_id")
    ai_summary.create_index([("metadata.created_at", 1)])
    ai_summary.create_index([("metadata.date", 1)])

    # AI raw interaction collection
    if 'ai_raw' not in db.list_collection_names():
        db.create_collection('ai_raw')
    ai_raw = db['ai_raw']
    ai_raw.create_index("user_id")
    ai_raw.create_index([("metadata.expires_at", 1)], expireAfterSeconds=0)
    ai_raw.create_index([("metadata.created_at", 1)])

    # Blogs collection
    if 'blog' not in db.list_collection_names():
        db.create_collection('blog')
    blogs = db['blog']
    blogs.create_index("blog_id", unique=True)
    
    # User profile collection
    if 'user_profiles' not in db.list_collection_names():
        db.create_collection('user_profiles')
    user_profile = db['user_profiles']
    user_profile.create_index("user_id", unique=True)
    
    # Embeddings collection
    if 'ai_embeddings' not in db.list_collection_names():
        db.create_collection('ai_embeddings')
    ai_embeddings = db['ai_embeddings']
    ai_embeddings.create_index([("user_id", 1)])
    ai_embeddings.create_index([("metadata.created_at", 1)])
    ai_embeddings.create_index([("metadata.summary_type", 1)])
    
    # Symptom collection
    if 'symptoms' not in db.list_collection_names():
        db.create_collection('symptoms')
    symptoms = db['symptoms']
    symptoms.create_index([("user_id", 1)])
    symptoms.create_index([("date", 1)])
    symptoms.create_index([("user_id", 1), ("date", 1)], unique=True)


def get_mongo_database():
    """Connect to MongoDB and return the database instance"""
    pwd = os.getenv("MONGO_PWD")
    uri = f"mongodb+srv://smitp:{urllib.parse.quote(str(pwd))}@menova-cluster-1.wqldsvi.mongodb.net/?appName=menova-cluster-1"

    client = MongoClient(uri)
    
    # Initialize the database with all required collections and indexes
    initialize_database(client)

    try:
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(e)

    return client['menova_main']