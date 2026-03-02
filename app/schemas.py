from pydantic import BaseModel

class SeatBase(BaseModel):
    seat_number: str
    is_booked: bool

#create a full seat that inherit from seatbase
class Seat(SeatBase):
    id: int   # since this represents a seat that has already exists in database, it will have an id

    # This Config class is a special Pydantic instruction.
    class Config:
        # from_attributes = True tells Pydantic: "It's okay to read data directly from our SQLAlchemy database models."
        # Without this line, Pydantic would crash because it only understands standard Python dictionaries by default.
        from_attributes = True

# 3. This defines the exact data a user MUST send us in their API request to book a seat.
class BookingCreate(BaseModel):
    user_id: int
    seat_id: int

    #didnt ask user for booking id bc db automatically generates it

class Booking(BaseModel):
    # We send them back the official Booking ID that the database just created for them.
    id: int

    # confirm there user_id
    user_id = int

    # confirm the seat they just booked
    seat_id = int

    #we need this special Config so Pydantic can read the SQLAlchemy database object we hand to it. 
    class Config:
        from_attributes = True