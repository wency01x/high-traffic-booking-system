from sqlalchemy import Integer, String, Boolean, ForeignKey, DateTime
from app.database import Base
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime


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
    seat_id: Mapped[int] = mapped_column(Integer, ForeignKey("seats.id"))
    customer_name: Mapped[str] = mapped_column(String)

    status: Mapped[str] = mapped_column(String, default="PENDING")
    expires_at: Mapped[datetime] = mapped_column(DateTime)

    seat = relationship("Seat")
