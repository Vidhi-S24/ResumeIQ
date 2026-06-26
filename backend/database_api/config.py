from pathlib import Path
from dotenv import load_dotenv
import os

# backend folder
BASE_DIR = Path(__file__).resolve().parent.parent

# Load backend/.env
load_dotenv(BASE_DIR / ".env")

# MongoDB
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

# JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480")
)