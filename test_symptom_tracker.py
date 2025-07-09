import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"  # Change if your server runs on a different port

# Function to get authentication token
def get_auth_token(username, password):
    login_data = {
        "user_name": username,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json().get("token")
    else:
        print(f"Login failed: {response.text}")
        return None

# Test symptom types endpoint
def test_symptom_types(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/symptoms/types", headers=headers)
    if response.status_code == 200:
        print("Symptom types:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error getting symptom types: {response.text}")

# Test logging a symptom
def test_log_symptom(token, user_id, symptom, severity):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    today = datetime.now().strftime("%Y-%m-%d")
    data = {
        "user_id": user_id,
        "date": today,
        "symptom": symptom,
        "severity": severity
    }
    
    print(f"Logging symptom: {symptom}, severity: {severity}")
    response = requests.post(f"{BASE_URL}/symptoms/log", headers=headers, json=data)
    
    if response.status_code == 200:
        print("Symptom logged successfully!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error logging symptom: {response.text}")

# Test getting weekly symptoms
def test_weekly_symptoms(token, user_id):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Calculate Monday of current week
    today = datetime.now()
    monday = today - timedelta(days=today.weekday())
    monday_str = monday.strftime("%Y-%m-%d")
    
    data = {
        "user_id": user_id,
        "start_date": monday_str
    }
    
    print(f"Getting weekly symptoms starting from {monday_str}")
    response = requests.post(f"{BASE_URL}/symptoms/weekly", headers=headers, json=data)
    
    if response.status_code == 200:
        print("Weekly symptoms retrieved:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error getting weekly symptoms: {response.text}")

# Test chat with symptom mention
def test_chat_with_symptoms(token, user_id):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    message = "I've been experiencing severe hot flashes and mild anxiety lately. What can I do?"
    
    data = {
        "user_id": user_id,
        "query": message
    }
    
    print(f"Sending chat message with symptoms: {message}")
    response = requests.post(f"{BASE_URL}/chat/message", headers=headers, json=data)
    
    if response.status_code == 200:
        print("Chat response received:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error in chat: {response.text}")

# Main testing function
def main():
    username = "dummy123"  # Replace with your actual username
     # Replace with your actual password
    
    password= "dummy_password"
    print("Testing symptom tracker functionality...")
    
    # Get authentication token
    token = get_auth_token(username, password)
    if not token:
        return
    
    # Get user ID from token (you may need to extract this differently)
    # For testing, use the user ID you know is associated with this account
    user_id = "test_user"  # Replace with your actual user ID
    
    # Run tests
    test_symptom_types(token)
    
    # Log some symptoms
    test_log_symptom(token, user_id, "hot flashes", 4)
    test_log_symptom(token, user_id, "sleep issues", 2)
    test_log_symptom(token, user_id, "mood swings", 3)
    
    # Get weekly view
    test_weekly_symptoms(token, user_id)
    
    # Test automatic symptom detection in chat
    test_chat_with_symptoms(token, user_id)
    
    # Check if symptoms were detected from chat
    print("\nChecking if symptoms were detected from chat:")
    test_weekly_symptoms(token, user_id)

if __name__ == "__main__":
    main()