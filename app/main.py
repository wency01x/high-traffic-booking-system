from fastapi import FastAPI
from app.database import engine
from app import models

#create the table in the database
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def health_check():
    return{"status": "Booking System Database is running!"}

