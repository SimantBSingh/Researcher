import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "fastapi-researcher-react-drive")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 120
    DATABASE_URL = os.getenv('DATABASE_URL')
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Gmail sender address
    EMAIL = os.getenv("EMAIL")

    # Gmail OAuth2 credentials (from Google Cloud Console)
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REFRESH_TOKEN = os.getenv("GOOGLE_REFRESH_TOKEN")
