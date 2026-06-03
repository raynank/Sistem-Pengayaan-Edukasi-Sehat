import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    # Use SQLite for prototyping if DATABASE_URL is not set, otherwise use PostgreSQL
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///internetsehat.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
