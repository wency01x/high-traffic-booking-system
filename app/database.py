from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:jhoseryl@localhost:5433/booking_db"
# create the engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# create session local class
Sessionlocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# create the base class 
Base = declarative_base()

# dependency to get db session
def get_db():
    db = Sessionlocal()
    try: 
        yield db
    finally:
        db.close()