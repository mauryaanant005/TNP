import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the DATABASE_URL from the environment
DATABASE_URL = os.getenv("DATABASE_URL")
