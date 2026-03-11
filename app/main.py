import asyncio
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import engine, get_db, SessionLocal   
from app import models, schemas
from datetime import datetime, timedelta, timezone

#create the table in the database
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

async def released_expired_seats():
    while True:
        await asyncio.sleep(60)  # Check every minute for expired bookings

        db = SessionLocal()
        try:
            current_time = datetime.now(timezone.utc)

            #find all abandoned tickets
            expired_bookings = db.query(models.Booking).filter(
                models.Booking.status == "PENDING",
                models.Booking.expires_at < current_time
            ).all()

            for booking in expired_bookings:
                # free the seat
                seat = db.query(models.Seat).filter(
                    models.Seat.id == booking.seat_id
                    ).first()
                if seat:
                    seat.is_booked = False
                
                booking.status = "CANCELED"

            # save changes
            if expired_bookings:
                db.commit()
                print(f"Cleaned up {len(expired_bookings)} expired bookings and released their seats.")

        finally:
            db.close()
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(released_expired_seats())


@app.post("/users/", response_model=schemas.User) #add user to schemas
def create_user(username: str, db: Session = Depends(get_db)):
    #create a new user in the db
    new_user = models.User(username=username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/seats/", response_model=list[schemas.Seat])
def get_available_seats(db: Session = Depends(get_db)):
    available_seats = db.query(models.Seat).filter(models.Seat.is_booked == False).all()
    return available_seats

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

    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found. Sorry")
    if seat.is_booked:
        raise HTTPException(status_code=400, detail="Seat is currently on hold by another user. Check back in 5 minutes!")
    
    #5min countdown timer
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=5)
    #create the pending ticket
    new_booking = models.Booking(
        user_id=booking.user_id,
        seat_id=booking.seat_id,
        status="PENDING",
        expires_at=expiration_time
    )
    # SOFTLOCK THE SEAT SO NO ONE ELSE CAN CLICK IT
    seat.is_booked = True
    seat.version += 1

    db.add(new_booking)
    db.commit()
    db.refresh (new_booking)
    
    return new_booking
@app.post("/bookings/{booking_id}/pay")
def pay_for_ticket(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    if booking.status == "CONFIRMED":
        return {"message": "Ticket is already paid for!"}
    
    if booking.status == "CANCELED":
        raise HTTPException(status_code=400, detail="This booking was canceled.")

    # CRITICAL CHECK: Did the 5-minute timer run out?
    current_time = datetime.now(timezone.utc)
    # Ensure both are timezone aware for safe comparison
    safe_expire_time = booking.expires_at.replace(tzinfo=timezone.utc) if booking.expires_at.tzinfo is None else booking.expires_at
    if current_time > safe_expire_time:
        # time expired! free up the next person

        seat = db.query(models.Seat).filter(models.Seat.id == booking.seat_id).first()
        if seat:
            seat.is_booked = False

        booking.status = "CANCELED"
        db.commit()
        raise HTTPException(status_code=400, detail="Time expired! Seat released back to the public.")
    
    #if timer is still good, confirm the payment!
    booking.status = "CONFIRMED"
    db.commit()

    return {"message": "Payment Successful! The seat is permanently yours."}

@app.get("/bookings/{user_id}", response_model=list[schemas.Booking])
def get_user_bookings(user_id: int, db: Session = Depends(get_db)):
    bookings = db.query(models.Booking).filter(models.Booking.user_id == user_id).all()

    if not bookings:
        raise HTTPException(status_code=404, detail="No bookings found for this user.")
    return bookings

@app.delete("/bookings/{booking_id}")
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    #step A find the ticket booking
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    #step B find the seat attached to this booking and make it available again
    seat = db.query(models.Seat).filter(models.Seat.id == booking.seat_id).first()
    if seat:
        seat.is_booked = False
    
    #Step C Delete the ticket and save changes
    db.delete(booking)
    db.commit()

    return {"message": f"Booking {booking_id} cancelled successfully. Seat is now avaiable."}
    