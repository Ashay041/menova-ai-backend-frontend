import json
from datetime import datetime, timedelta
from textblob import TextBlob
import os



class ProgressTrackingAgent:
    """Tracks user progress over multiple chatbot sessions."""

    def __init__(self, memory_directory: str = "user_memories"):
        self.memory_directory = memory_directory
        os.makedirs(memory_directory, exist_ok=True)

    def _get_memory_path(self, user_id: str) -> str:
        """Returns the file path for storing user progress."""
        return os.path.join(self.memory_directory, f"{user_id}_progress.json")

    def _load_user_progress(self, user_id: str) -> dict:
        """Load user progress history from file."""
        path = self._get_memory_path(user_id)
        if os.path.exists(path):
            with open(path, "r") as file:
                return json.load(file)
        return {"user_id": user_id, "sessions": [], "last_follow_up": None}

    def _save_user_progress(self, user_id: str, data: dict):
        """Save updated progress to file."""
        path = self._get_memory_path(user_id)
        with open(path, "w") as file:
            json.dump(data, file, indent=4)

    def extract_symptoms(self, text: str) -> list:
        """Extracts menopause-related symptoms from user queries."""
        symptom_keywords = [
            "hot flashes", "night sweats", "fatigue", "mood swings", "anxiety", "headaches",
            "brain fog", "sleep disturbances", "weight gain", "low libido", "joint pain"
        ]
        return [symptom for symptom in symptom_keywords if symptom in text.lower()]

    def analyze_sentiment(self, text: str) -> float:
        """Analyzes sentiment of user input (range: 0 - negative, 1 - positive)."""
        return (TextBlob(text).sentiment.polarity + 1) / 2  # Normalize to 0-1

    def update_progress(self, user_id: str, user_message: str):
        """Updates user progress with new symptoms and sentiment."""
        data = self._load_user_progress(user_id)

        # Extract symptoms using keyword-based approach (can be replaced with NER)
        symptoms = self.extract_symptoms(user_message)
        sentiment_score = self.analyze_sentiment(user_message)

        # Store session with timestamp
        session_entry = {
            "timestamp": datetime.now().isoformat(),
            "symptoms": symptoms,
            "sentiment_score": sentiment_score
        }
        data["sessions"].append(session_entry)

        # Keep only last 5 sessions for analysis
        data["sessions"] = data["sessions"][-5:]

        # Schedule next follow-up in 2-3 days
        next_follow_up = datetime.now() + timedelta(days=2)
        data["last_follow_up"] = next_follow_up.isoformat()

        # Save progress
        self._save_user_progress(user_id, data)

    def generate_progress_summary(self, user_id: str) -> str:
        """Generates a progress summary based on user symptom trends."""
        data = self._load_user_progress(user_id)
        sessions = data.get("sessions", [])

        if len(sessions) < 2:
            return "Not enough data to track progress yet."

        sessions.sort(key=lambda x: x["timestamp"])

        symptom_trends = []
        all_symptoms = [set(s["symptoms"]) for s in sessions]
        sentiment_scores = [s["sentiment_score"] for s in sessions]

        for i in range(1, len(sessions)):
            prev_symptoms = all_symptoms[i - 1]
            curr_symptoms = all_symptoms[i]

            new_symptoms = curr_symptoms - prev_symptoms
            improved_symptoms = prev_symptoms - curr_symptoms

            if new_symptoms:
                symptom_trends.append(f"On {datetime.fromisoformat(sessions[i]['timestamp']).strftime('%B %d')}, you started experiencing {', '.join(new_symptoms)}.")
            if improved_symptoms:
                symptom_trends.append(f"By {datetime.fromisoformat(sessions[i]['timestamp']).strftime('%B %d')}, your {', '.join(improved_symptoms)} improved.")

        # Analyze sentiment trend
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
        if sentiment_scores[-1] > sentiment_scores[0]:
            sentiment_trend = "You seem to be feeling better. 😊"
        elif sentiment_scores[-1] < sentiment_scores[0]:
            sentiment_trend = "You seem to be feeling worse. 💙"
        else:
            sentiment_trend = "Your mood has remained stable."

        summary = "Here's your progress update:\n" + "\n".join(symptom_trends) + "\n" + sentiment_trend
        return summary
