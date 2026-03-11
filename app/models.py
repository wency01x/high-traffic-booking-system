from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from app.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)

class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    seat_number = Column(String, unique=True, index=True)
    is_booked = Column(Boolean, default=False)

    # concurrency version control
    version = Column(Integer, nullable=False, default=1)

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    seat_id = Column(Integer, ForeignKey("seats.id"), unique=True)

    status = Column(String, default="PENDING")
    expires_at = Column(DateTime)

    user = relationship("User")
    seat = relationship("Seat")
