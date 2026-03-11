

export type SeatStatus = 'available' | 'pending' | 'booked';

export interface Seat {
  id: string;
  status: SeatStatus;
}

export interface CartItem {
  seatId: string;
  endTime: number;
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
