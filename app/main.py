from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import engine, get_db
from app import models, schemas

#create the table in the database
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.post("/users/", response_model=schemas.User) #add user to schemas
def create_user(username: str, db: Session = Depends(get_db)):
    #create a new user in the db
    new_user = models.User(username=username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/seats/", response_model=schemas.Seat)
def create_seat(seat: schemas.SeatBase, db: Session = Depends(get_db)):
    #create a new seat in db
    new_seat = models.Seat(seat_number=seat.seat_number, is_booked=seat.is_booked)
    db.add(new_seat)
    db.commit()
    db.refresh(new_seat)
    return new_seat

@app.post("/booking/", response_model=schemas.Booking)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    #step A find the requested seat 
    seat = db.query(models.Seat).filter(models.Seat.id == booking.seat_id).first()

    if not seat():
        raise HTTPException(status_code=404, detail="Seat not found. Sorry")
    if seat.is_booked():
        raise HTTPException(status_code=400, detail="Seat is already booked")

    #step B optimistic looking
    #we attempt to update the seat, but only if the version matches we just read 
    #if 100 people clicks book at the same time , only the first one gets the matching version

    updated_count = db.query(models.seat).filter(
        models.Seat.id == seat.id,
        models.Seat.version == seat.version # the concurrency check
    ). update({
        "is_booked": True,
        "version": seat.version + 1 # increment the version for the next check
    })

    #step C: check if we won the race 
    if updated_count == 0:
        #if updated count is 0, it means the version changed before we could saved it
        #someone else beat us by millisecond
        raise HTTPException(status_code=409, detail="Seat was just booked by someone else. Please select another seat")

    #step D: we got the seat meaning we won. then save the booking to db
    new_booking = models.Booking(user_id=booking.user_id, seat_id=booking.seat_id)
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking