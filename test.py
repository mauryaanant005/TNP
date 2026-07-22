import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the DATABASE_URL from the environment
DATABASE_URL = os.getenv("DATABASE_URL")

# Parse the DATABASE_URL (using dj-database-url or custom logic)
print(DATABASE_URL)
