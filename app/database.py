from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("db url is missing")

# create the engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# create session local class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# create the base class 
Base = declarative_base()

# dependency to get db session
def get_db():
    db = SessionLocal()
    try: 
        yield db
    finally:
        db.close()