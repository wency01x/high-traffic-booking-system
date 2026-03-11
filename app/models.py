from sqlalchemy import Integer, String, Boolean, ForeignKey, DateTime
from app.database import Base
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)

class Seat(Base):
    __tablename__ = "seats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    seat_number: Mapped[str] = mapped_column(String, unique=True, index=True)
    is_booked: Mapped[bool] = mapped_column(Boolean, default=False)

    # concurrency version control
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    seat_id: Mapped[int] = mapped_column(Integer, ForeignKey("seats.id"), unique=True)

    status: Mapped[str] = mapped_column(String, default="PENDING")
    expires_at: Mapped[datetime] = mapped_column(DateTime)

    user = relationship("User")
    seat = relationship("Seat")
