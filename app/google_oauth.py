from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
import os

router = APIRouter()

CLIENT_SECRETS_FILE = "credentials.json"
SCOPES = ["https://www.googleapis.com/auth/calendar"]
REDIRECT_URI = "http://localhost:8000/auth/google/callback"

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"  # only for dev

# Step 1: Initiate OAuth
@router.get("/auth/google")
def auth_google():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    auth_url, state = flow.authorization_url(prompt='consent', access_type='offline')
    return RedirectResponse(auth_url)

# Step 2: Handle callback
@router.get("/auth/google/callback")
def auth_callback(request: Request):
    code = request.query_params["code"]
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    flow.fetch_token(code=code)
    credentials = flow.credentials

    # STORE this securely per user_id
    user_token_data = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes
    }

    # Save this dict into MongoDB or secure store
    save_user_token(user_id, user_token_data)

    return {"message": "Google Calendar linked successfully!"}
