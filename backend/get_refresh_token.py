"""
Run this script ONCE locally to obtain a Gmail OAuth2 refresh token.

Usage:
    cd backend
    pip install google-auth-oauthlib
    python get_refresh_token.py

It will open a browser window asking you to sign in with unoairlab@gmail.com
and grant the app permission to send email.  Paste the printed refresh token
into your .env file as GOOGLE_REFRESH_TOKEN.
"""

import os
from dotenv import load_dotenv
from google_auth_oauthlib.flow import InstalledAppFlow

load_dotenv()

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

if not CLIENT_ID or not CLIENT_SECRET:
    raise SystemExit("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env")

client_config = {
    "installed": {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uris": ["http://localhost"],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }
}

flow = InstalledAppFlow.from_client_config(
    client_config,
    scopes=["https://www.googleapis.com/auth/gmail.send"],
)

creds = flow.run_local_server(port=0)

print("\n" + "=" * 60)
print("Add this to your .env file:")
print(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}")
print("=" * 60 + "\n")
