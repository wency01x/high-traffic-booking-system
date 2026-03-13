import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { BoxOffice } from './components/BoxOffice';
import { MyTickets } from './components/MyTickets';
import { AdminPanel } from './components/AdminPanel';
import { ConfirmModal } from './components/ConfirmModal';
import { Toast } from './components/Toast';
import type { Seat, CartItem, HistoryItem, ToastMessage } from './types';

const HOLD_DURATION_MS = 5 * 60 * 1000;

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('boxoffice');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [cart, setCart] = useState<CartItem | null>(null);
  const [seatToConfirm, setSeatToConfirm] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // FIX: Initializing with an EMPTY array removes the "ghost" bookings!
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [guestName, setGuestName] = useState<string>('');

  // API SYNC: Fetch real data from FastAPI
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8001/seats/');
        if (response.ok) {
          const data = await response.json();
          const formattedSeats = data.map((seat: any) => ({
            id: seat.seat_number,
            status: seat.is_booked ? 'booked' : 'available'
          }));

          formattedSeats.sort((a: any, b: any) => 
            a.id.localeCompare(b.id, undefined, { numeric: true })
          );
          
          setSeats(formattedSeats);
        }
      } catch (error) {
        console.error("Failed to connect to the Python backend:", error);
      }
    };

    fetchSeats();
    const interval = setInterval(fetchSeats, 3000);
    return () => clearInterval(interval);
  }, []);

  const showToast = useCallback((type: 'success' | 'danger', title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const openConfirmModal = (id: string) => setSeatToConfirm(id);
  const closeConfirmModal = () => setSeatToConfirm(null);

const confirmSeatSelection = async () => {
    if (!seatToConfirm) return;
    const id = seatToConfirm; // This is the string (e.g., "A1")

    try {
      // 1. Quick lookup: Find the integer Database ID for this seat
      const seatsResponse = await fetch('http://127.0.0.1:8001/seats/');
      const seatsData = await seatsResponse.json();
      const realSeat = seatsData.find((s: any) => s.seat_number === id);

      if (!realSeat) throw new Error("Seat not found in DB");

      // 2. The Bridge! Tell Python to put this seat ON HOLD
      const bookingResponse = await fetch('http://127.0.0.1:8001/booking/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seat_id: realSeat.id,      // Python gets the integer it wants
          customer_name: "Pending"   // Placeholder until they pay
        })
      });

      if (!bookingResponse.ok) {
        const err = await bookingResponse.json();
        alert(err.detail || "Seat is currently on hold by someone else!");
        closeConfirmModal();
        return;
      }

      // We get the new DB row back!
      const bookingData = await bookingResponse.json();

      // 3. Update the React UI (Your exact original code)
      setSeats(prev => prev.map(s => {
        if (s.id === cart?.seatId && s.status === 'pending') return { ...s, status: 'available' };
        if (s.id === id) return { ...s, status: 'pending' };
        return s;
      }));
      
      // the bookingId to save to the cart
      setCart({ 
        seatId: id, 
        endTime: Date.now() + HOLD_DURATION_MS, 
        bookingId: bookingData.id 
      });
      
      closeConfirmModal();
      setActiveTab('mytickets');
      showToast('success', 'Seat On Hold', `Seat ${id} reserved for 5 minutes.`);

    } catch (error) {
      console.error(error);
      alert("Could not connect to the database to hold the seat.");
      closeConfirmModal();
    }
  };

const payCart = async () => {
    if (!cart) return;

    if (!guestName.trim()) {
      alert("Please enter a Ticket Holder Name!");
      return;
    }

    try {
      // Check your terminal! If it says 8001, change the 8000 below to 8001
      const response = await fetch(`http://127.0.0.1:8001/bookings/${cart.bookingId}/pay`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Payment failed");
      }

      // Success! Update the UI
      setSeats(prev => prev.map(s => s.id === cart.seatId ? { ...s, status: 'booked' } : s));
      setHistory(prev => [{
        id: `TXN-${cart.bookingId}`,
        seatId: cart.seatId,
        date: new Date().toLocaleDateString(),
        status: 'BOOKED'
      }, ...prev]);

      setCart(null);
      setGuestName('');
      showToast('success', 'Confirmed!', `Seat ${cart.seatId} is yours, ${guestName}!`);

    } catch (error: any) {
      console.error(error);
      alert(`Connection Error: ${error.message}`);
    }
  };

const releaseCart = async (isExpired = false) => {
    if(!cart) return;
    const seatId = cart.seatId;

    try {
      // THE FIX: Tell Python to delete the pending booking and free the seat!
      await fetch(`http://127.0.0.1:8001/bookings/${cart.bookingId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error("Failed to release seat in database", error);
    }

    // Update the UI
    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, status: 'available' } : s));

    setHistory(prev => [{
      id: `TXN-${cart.bookingId}`, // Upgraded to use the real database ID!
      seatId: seatId,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'CANCELED'
    }, ...prev]);

    setCart(null);
    setGuestName(''); // Wipes the name memory
    if (isExpired) showToast('danger', 'Hold Expired', `Seat ${seatId} has been released.`);
  };

  const handleUpdateSeatStatus = (seatId: string, isBooked: boolean) => {
    setSeats((prev) => prev.map(s => s.id === seatId ? { ...s, status: isBooked ? 'booked' : 'available' } : s));
  };

  useEffect(() => {
    if (!cart) return;
    const timer = setInterval(() => {
      if (cart.endTime <= Date.now()) releaseCart(true);
    }, 1000);
    return () => clearInterval(timer);
  }, [cart]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} hasCart={!!cart} />
      
      <main className="flex-1 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative w-full max-w-6xl mx-auto">
        {activeTab === 'boxoffice' && (
          <BoxOffice seats={seats} cart={cart} onSeatClick={openConfirmModal} />
        )}

        {activeTab === 'mytickets' && (
          <MyTickets 
            cart={cart}
            history={history}
            onRelease={() => releaseCart(false)}
            onPay={payCart}
            onGoToBoxOffice={() => setActiveTab('boxoffice')}
            guestName={guestName}
            setGuestName={setGuestName}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel onShowToast={showToast} onUpdateSeatStatus={handleUpdateSeatStatus} />
        )}
      </main>

      <ConfirmModal 
        isOpen={!!seatToConfirm} 
        seatId={seatToConfirm} 
        onConfirm={confirmSeatSelection} 
        onCancel={closeConfirmModal} 
      />

      <Toast toasts={toasts} />
    </div>
  );
}