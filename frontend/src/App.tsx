import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { BoxOffice } from './components/BoxOffice';
import { MyTickets } from './components/MyTickets';
import { AdminPanel } from './components/AdminPanel';
import { ConfirmModal } from './components/ConfirmModal';
import { Toast } from './components/Toast';
import type { Seat, CartItem, HistoryItem, ToastMessage } from './types';

const HOLD_DURATION_MS = 5 * 60 * 1000;

export default function App() {
  const navigate = useNavigate(); // This is our new "setActiveTab"
  const location = useLocation(); // This tells us which "tab" (URL) we are on
  
  const [seats, setSeats] = useState<Seat[]>([]);
  const [seatToConfirm, setSeatToConfirm] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [guestName, setGuestName] = useState<string>('');

  // 1. Read from localStorage on initial load
  const [cart, setCart] = useState<CartItem | null>(() => {
    const savedCart = localStorage.getItem('cinema_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart.endTime > Date.now()) return parsedCart;
      } catch (error) {
        console.error("Failed to parse cart from local storage");
      }
    }
    return null;
  });

  // 2. Auto-Redirect Logic: If they have a cart, send them to My Tickets on refresh
  useEffect(() => {
    if (cart && location.pathname === '/') {
      navigate('/mytickets');
    }
  }, []);

  useEffect(() => {
    if (cart) {
      localStorage.setItem('cinema_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('cinema_cart');
    }
  }, [cart]);

  // API SYNC: Fetch real data from FastAPI
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8001/seats/');
        if (response.ok) {
          const data = await response.json();
          const formattedSeats = data.map((seat: any) => {
            let seatStatus = 'available';
            if (seat.is_booked) {
              seatStatus = (cart && cart.seatId === seat.seat_number) ? 'pending' : 'booked';
            }
            return { id: seat.seat_number, status: seatStatus };
          });

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
  }, [cart]);

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
    const id = seatToConfirm;

    try {
      if (cart) {
        try {
          await fetch(`http://127.0.0.1:8001/bookings/${cart.bookingId}`, { method: 'DELETE' });
        } catch (e) { console.error("Failed to release old seat", e); }
      }

      const seatsResponse = await fetch('http://127.0.0.1:8001/seats/');
      const seatsData = await seatsResponse.json();
      const realSeat = seatsData.find((s: any) => s.seat_number === id);

      if (!realSeat) throw new Error("Seat not found in DB");

      const bookingResponse = await fetch('http://127.0.0.1:8001/booking/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_id: realSeat.id, customer_name: "Pending" })
      });

      if (!bookingResponse.ok) {
        const err = await bookingResponse.json();
        alert(err.detail || "Seat is currently on hold!");
        closeConfirmModal();
        return;
      }

      const bookingData = await bookingResponse.json();

      setCart({ 
        seatId: id, 
        endTime: Date.now() + HOLD_DURATION_MS, 
        bookingId: bookingData.id 
      });
      
      closeConfirmModal();
      navigate('/mytickets'); // REPLACED: setActiveTab
      showToast('success', 'Seat On Hold', `Seat ${id} reserved for 5 minutes.`);
    } catch (error) {
      console.error(error);
      alert("Database connection error.");
      closeConfirmModal();
    }
  };

// --- START REPLACING HERE ---
  const handlePaymentSuccess = useCallback(() => {
    if (!cart) return;

    setHistory(prev => [{
      id: `TXN-${cart.bookingId}`,
      seatId: cart.seatId,
      date: new Date().toLocaleDateString(),
      status: 'BOOKED'
    }, ...prev]);

    setCart(null);
    setGuestName('');
    showToast('success', 'Confirmed!', `Seat ${cart.seatId} is yours!`);
    navigate('/'); 
  }, [cart, navigate, showToast]);

  const releaseCart = async (isExpired = false) => {
    if(!cart) return;
    const seatId = cart.seatId;
    try {
      await fetch(`http://127.0.0.1:8001/bookings/${cart.bookingId}`, { method: 'DELETE' });
    } catch (error) { console.error("Failed to release seat", error); }

    setHistory(prev => [{
      id: `TXN-${cart.bookingId}`,
      seatId: seatId,
      date: new Date().toLocaleDateString(),
      status: 'CANCELED'
    }, ...prev]);

    setCart(null);
    setGuestName('');
    if (isExpired) showToast('danger', 'Hold Expired', `Seat ${seatId} released.`);
  };
  // --- STOP REPLACING HERE ---
  
const handleUpdateSeatStatus = (seatId: string, isBooked: boolean) => {
    setSeats((prev) => prev.map(s => s.id === seatId ? { ...s, status: isBooked ? 'booked' : 'available' } : s));
  };
  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      {/* Header now gets location.pathname instead of activeTab */}
      <Header activeTab={location.pathname} hasCart={!!cart} />
      
      <main className="flex-1 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative w-full max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={
            <BoxOffice seats={seats} cart={cart} onSeatClick={openConfirmModal} />
          } />
          
          <Route path="/mytickets" element={
            <MyTickets 
              cart={cart}
              history={history}
              onRelease={() => releaseCart(false)}
              onPaymentSuccess={handlePaymentSuccess}
              onGoToBoxOffice={() => navigate('/')}
              guestName={guestName}
              setGuestName={setGuestName}
            />
          } />

          <Route path="/admin" element={
            <AdminPanel onShowToast={showToast} onUpdateSeatStatus={handleUpdateSeatStatus} />
          } />
        </Routes>
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