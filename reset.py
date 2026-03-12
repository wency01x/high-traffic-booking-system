from app.database import engine
from app.models import Base

print("Nuking the database...")
Base.metadata.drop_all(bind=engine)

print("Rebuilding empty tables...")
Base.metadata.create_all(bind=engine)

print("Done! Clean slate.")