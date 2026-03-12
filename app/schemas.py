from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SeatBase(BaseModel):
    seat_number: str
    is_booked: bool = False #empty by default

class Seat(SeatBase):
    id: int   # since this represents a seat that already exists in database, it will have an id
    class Config:
        from_attributes = True

class User(BaseModel):
    id: int        
    username: str   
    class Config:
        from_attributes = True

class BookingBase(BaseModel):
    user_id: int
    seat_id: int

# (Deleted the duplicates! Kept the good ones down here)
class BookingCreate(BookingBase):
    pass # didn't ask user for booking id bc db automatically generates it

# the full receipt we send back to the user
class Booking(BookingBase):
    id: int
    status: str
    expires_at: Optional[datetime] = None
    class Config:
        from_attributes = True