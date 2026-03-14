

export type SeatStatus = 'available' | 'pending' | 'booked';

export interface Seat {
  id: string;
  status: SeatStatus;
}

export interface CartItem {
  seatIds: string[];
  endTime: number;
  bookingIds: number[];
}

export interface HistoryItem {
  id: string;
  seatId: string;
  date: string;
  status: 'BOOKED' | 'CANCELED';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger';
  title: string;
  message: string;
}


interface ConfirmModalProps {
  isOpen: boolean;
  seatIds: string[];
  // ...
}