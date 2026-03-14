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
  const navigate = useNavigate(); 
  const location = useLocation(); 
  
  const [seats, setSeats] = useState<Seat[]>([]);
  // --- MULTI-SEAT LOGIC: Replaced 'seatToConfirm' with an array and a modal toggle ---
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [guestName, setGuestName] = useState<string>('');

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

  // API SYNC
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8001/seats/');
        if (response.ok) {
          const data = await response.json();
          const formattedSeats = data.map((seat: any) => {
            let seatStatus = 'available';
            if (seat.is_booked) {
              // --- MULTI-SEAT LOGIC: Check if the seat is inside our cart array ---
              seatStatus = (cart && cart.seatIds.includes(seat.seat_number)) ? 'pending' : 'booked';
            } else if (selectedSeats.includes(seat.seat_number)) {
              // Optional: If your BoxOffice supports a 'selected' color!
              seatStatus = 'selected'; 
            }
            return { id: seat.seat_number, status: seatStatus };
          });

          formattedSeats.sort((a: any, b: any) => 
            a.id.localeCompare(b.id, undefined, { numeric: true })
          );
          setSeats(formattedSeats);
        }
      } catch (error) {
        console.error("Failed to connect to backend", error);
      }
    };

    fetchSeats();
    const interval = setInterval(fetchSeats, 3000);
    return () => clearInterval(interval);
  }, [cart, selectedSeats]);

  const showToast = useCallback((type: 'success' | 'danger', title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // --- MULTI-SEAT LOGIC: Toggle seats in and out of the array ---
// --- MULTI-SEAT LOGIC: Toggle seats in and out of the array ---
  const handleSeatClick = (id: string) => {
    if (cart) {
      showToast('danger', 'Checkout in Progress', 'Please finish or cancel your current order first.');
      return;
    }

    setSelectedSeats((prev) => {
      if (prev.includes(id)) {
        return prev.filter(seatId => seatId !== id); // Remove if already clicked
      }
      if (prev.length >= 4) {
        showToast('danger', 'Limit Reached', 'You can only reserve up to 4 seats at a time.');
        return prev;
      }
      return [...prev, id]; // Add to array
    });
  };

  const closeConfirmModal = () => setIsConfirmModalOpen(false);

  // --- MULTI-SEAT LOGIC: Book multiple seats in a loop ---
  const confirmSeatSelection = async () => {
    if (selectedSeats.length === 0) return;

    try {
      // Clear old cart if it exists
      if (cart) {
        for (const bookingId of cart.bookingIds) {
          try { await fetch(`http://127.0.0.1:8001/bookings/${bookingId}`, { method: 'DELETE' }); } catch(e) {}
        }
      }

      const seatsResponse = await fetch('http://127.0.0.1:8001/seats/');
      const seatsData = await seatsResponse.json();

      const newBookingIds: number[] = [];
      const successfullyHeldSeats: string[] = [];

      // Loop through selected seats and book them one by one
      for (const seatId of selectedSeats) {
        const realSeat = seatsData.find((s: any) => s.seat_number === seatId);
        if (!realSeat) continue;

        const bookingResponse = await fetch('http://127.0.0.1:8001/booking/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seat_id: realSeat.id, customer_name: "Pending" })
        });

        if (bookingResponse.ok) {
          const bookingData = await bookingResponse.json();
          newBookingIds.push(bookingData.id);
          successfullyHeldSeats.push(seatId);
        }
      }

      if (successfullyHeldSeats.length === 0) {
        showToast('danger', 'Error', 'Those seats are no longer available!');
        closeConfirmModal();
        return;
      }

      setCart({ 
        seatIds: successfullyHeldSeats, 
        endTime: Date.now() + HOLD_DURATION_MS, 
        bookingIds: newBookingIds 
      });
      
      closeConfirmModal();
      setSelectedSeats([]); // Clear the floating bar
      navigate('/mytickets'); 
      showToast('success', 'Seats On Hold', `Reserved ${successfullyHeldSeats.length} seat(s) for 5 minutes.`);
    } catch (error) {
      alert("Database connection error.");
      closeConfirmModal();
    }
  };

  // --- MULTI-SEAT LOGIC: Create history for multiple seats ---
  const handlePaymentSuccess = useCallback(() => {
    if (!cart) return;

    const newHistoryItems = cart.seatIds.map((seatId, index) => ({
      id: `TXN-${cart.bookingIds[index]}`,
      seatId: seatId,
      date: new Date().toLocaleDateString(),
      status: 'BOOKED' as const
    }));

    setHistory(prev => [...newHistoryItems, ...prev]);
    setCart(null);
    setGuestName('');
    showToast('success', 'Confirmed!', `Your seats are officially yours!`);
    navigate('/'); 
  }, [cart, navigate, showToast]);

  // --- MULTI-SEAT LOGIC: Release multiple seats ---
  const releaseCart = async (isExpired = false) => {
    if(!cart) return;
    
    for (const bookingId of cart.bookingIds) {
      try { await fetch(`http://127.0.0.1:8001/bookings/${bookingId}`, { method: 'DELETE' }); } catch(e) {}
    }

    const cancelledItems = cart.seatIds.map((seatId, index) => ({
      id: `TXN-${cart.bookingIds[index]}`,
      seatId: seatId,
      date: new Date().toLocaleDateString(),
      status: 'CANCELED' as const
    }));

    setHistory(prev => [...cancelledItems, ...prev]);
    setCart(null);
    setGuestName('');
    if (isExpired) showToast('danger', 'Hold Expired', `Your seats were released.`);
  };
  
  const handleUpdateSeatStatus = (seatId: string, isBooked: boolean) => {
    setSeats((prev) => prev.map(s => s.id === seatId ? { ...s, status: isBooked ? 'booked' : 'available' } : s));
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden relative">
      <Header activeTab={location.pathname} hasCart={!!cart} />
      
      <main className="flex-1 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative w-full max-w-6xl mx-auto pb-24">
        <Routes>
          <Route path="/" element={
            <BoxOffice seats={seats} cart={cart} onSeatClick={handleSeatClick} />
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

      {/* --- NEW: Floating Checkout Bar --- */}
      {location.pathname === '/' && selectedSeats.length > 0 && !cart && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#0A0A0A] border border-emerald-500/30 p-4 rounded-lg shadow-2xl z-40 flex items-center gap-6 animate-fadeIn">
          <div className="text-white">
            <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">Selected Seats</span>
            <span className="font-mono text-emerald-400 font-bold text-lg">{selectedSeats.join(', ')}</span>
          </div>
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            className="bg-emerald-500 text-black px-6 py-3 rounded-sm font-bold tracking-wide hover:bg-emerald-400 transition-colors whitespace-nowrap"
          >
            Hold {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      <ConfirmModal 
        isOpen={isConfirmModalOpen} 
        seatIds={selectedSeats} // Passed the array here!
        onConfirm={confirmSeatSelection} 
        onCancel={closeConfirmModal} 
      />

      <Toast toasts={toasts} />
    </div>
  );
}