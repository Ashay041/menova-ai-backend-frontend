from pydantic import BaseModel

def get_mongo_collection(db, collection_name: str):
    """
    Returns a MongoDB collection object for the specified collection name.
    """

    collection = db[collection_name]
    return collection


def add_to_collection(db, collection_name: str, data: BaseModel):
    """
    Adds a document to the specified MongoDB collection.
    """

    collection = get_mongo_collection(db, collection_name)
    try:
        result = collection.insert_one(data.dict())
        return result.inserted_id
    except Exception as e:
        print(f"Error inserting document: {e}")
        return None


def add_to_collection_many(db, collection_name: str, data_list: list):
    collection = get_mongo_collection(db, collection_name)
    data_list = [data.__dict__ for data in data_list]
    try:
        result = collection.insert_many(data_list)
        return result
    except Exception as e:
        print(f"Error inserting many documents: {e}")
        return None


def index_exists(db, collection_name: str, index_name: str, index_value: str) -> bool:
    """
    Check if an index exists in the specified MongoDB collection.
    """

    collection = get_mongo_collection(db, collection_name)
    return collection.find_one({index_name: index_value}) is not None


def fetch_collection_by_id_list_all(db, collection_name: str, id_key: str, id_value: str, limit:int = None):
    """
    Fetches the entire collection from the database.
    """

    collection = get_mongo_collection(db, collection_name)
    query = {id_key: {"$in": [id_value]}}
    try:
        if limit:
            documents = list(collection.find(query).limit(limit))
        else:
            documents = list(collection.find(query))
        return documents
    except Exception as e:
        print(f"Error fetching collection: {e}")
        return []
    

def fetch_collection_by_id_all(db, collection_name: str, id_key: str, id_value:str, limit: int = None):
    """
    Fetches the entire collection from the database.
    """

    collection = get_mongo_collection(db, collection_name)
    try:
        if limit:
            documents = list(collection.find({id_key: id_value}).limit(limit))
        else:
            documents = list(collection.find({id_key: id_value}))
        return documents
    except Exception as e:
        print(f"Error fetching collection: {e}")
        return []



def fetch_collection_by_id_one(db, collection_name: str, id_key: str, id_value: str):
    """
    Fetches the entire collection from the database.
    """

    collection = get_mongo_collection(db, collection_name)
    try:
        document = collection.find_one({id_key: id_value})
        return document
    except Exception as e:
        print(f"Error fetching collection: {e}")
        return []

def fetch_all_from_collection(db, collection_name: str):
    """
    Fetches all documents from the specified MongoDB collection.
    """ 

    collection = get_mongo_collection(db, collection_name)
    try:
        documents = list(collection.find({}))
        return documents
    except Exception as e:
        print(f"Error fetching all documents from collection: {e}")
        return []
    
    
def fetch_many_from_collection(db, collection_name: str, filter: dict, limit: int = None):
    """
    Fetches documents from the specified MongoDB collection based on a filter.
    """

    collection = get_mongo_collection(db, collection_name)
    try:
        if limit:
            documents = list(collection.find(filter).limit(limit))
        else:
            documents = list(collection.find(filter))
        return documents
    except Exception as e:
        print(f"Error fetching documents from collection: {e}")
        return []
    
    
def fetch_collection_sorted_by_id(db, collection_name: str, id_key:str, id_value: str, sort_by: str = "timestamp", limit: int = None):
    """
    Fetches documents from the specified MongoDB collection sorted by a field.
    """

    collection = get_mongo_collection(db, collection_name)

    try:
        if limit:
            documents = list(collection.find({id_key: id_value}).sort(sort_by, -1).limit(limit))
        else:
            documents = list(collection.find({id_key: id_value}).sort(sort_by, -1))
        return documents
    except Exception as e:
        print(f"Error fetching sorted documents from collection: {e}")
        return []


def delete_one_from_collection(db, collection_name, filter: dict):
    """
    Delete one document from a collection defined by schema_class.
    """
    result = db[collection_name].delete_one(filter)
    if result.deleted_count > 0:
        print(f"Deleted 1 document from '{collection_name}' with filter: {filter}")
    else:
        print(f"No document matched in '{collection_name}' with filter: {filter}")
    return result.deleted_count


def delete_all_from_collection(db, collection_name):
    """
    Delete all documents from a collection defined by schema_class.
    """
    result = db[collection_name].delete_many({})
    print(f" Deleted {result.deleted_count} documents from '{collection_name}'")
    return result.deleted_count


def delete_all_from_collection_by_id(db, collection_name, id_key: str, id_value: str):
    """
    Delete all documents from a collection defined by schema_class.
    """
    result = db[collection_name].delete_many({id_key: id_value})
    print(f" Deleted {result.deleted_count} documents from '{collection_name}'")
    return result.deleted_count


def delete_one_from_collection_by_id(db, collection_name, id_key: str, id_value: str):
    """
    Delete a single document from the collection using its _id.
    """
    result = db[collection_name].delete_one({id_key: id_value})

    if result.deleted_count == 1:
        print(f" Successfully deleted document with id_key - {id_key} : {id_value} from '{collection_name}'")
    else:
        print(f"No document found with _id: - {id_key} : {id_value} in '{collection_name}'")

    return result.deleted_count