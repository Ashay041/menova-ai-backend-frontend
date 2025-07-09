from database.db_dao import get_blogs, save_blog
from database.schema import Blog
from database.db import get_mongo_database
class RecommendationAgent:
    """
    Agent to recommend blogs based on user interests.
    """

    def __init__(self, db):
        self.db = db

   
    def get_recommended_blogs(self, db, user_id, limit: int = 5):
        """
        Recommend blogs based on the user's interests.
        """
        # TODO: Replace with vidhi's function by sending user_id
        keywords = ["headache", "hot_flashes"]
        try:
            all_blogs = []
            for keyword in keywords:
                blogs = get_blogs(db, keyword, limit=limit)
                all_blogs.extend(blogs)
            # Remove duplicates
            unique_blogs = {blog['blog_id']: blog for blog in all_blogs}.values()
            # final_blogs = [blog.dict() for blog in unique_blogs]
            return list(unique_blogs)
        except Exception as e:
            print(f"Error recommending blogs: {e}")
            return []


    def save_blog_to_db(self, db, _title, _content, _keywords):
        """
        Save a blog to the database.
        """

        import uuid

        def generate_blog_id():
            return f"blog-{uuid.uuid4().hex[:6]}"

        try:
            blog = Blog(
                blog_id=generate_blog_id(),
                title=_title,
                content=_content,
                keywords=_keywords,
            )
            inserted_id = save_blog(db, blog)
            return inserted_id
        except Exception as e:
            print(f"Error saving blog: {e}")
            return None
        
        