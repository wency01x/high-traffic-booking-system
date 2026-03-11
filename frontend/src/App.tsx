import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { BoxOffice } from './components/BoxOffice';
import { MyTickets } from './components/MyTickets';
import { AdminPanel } from './components/AdminPanel';
import { ConfirmModal } from './components/ConfirmModal';
import { Toast } from './components/Toast';
import type { Seat, CartItem, HistoryItem, ToastMessage } from './types';

const HOLD_DURATION_MS = 5 * 60 * 1000;

function generateInitialSeats(): Seat[] {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const cols = 8;
  const initialSeats: Seat[] = [];
  
  rows.forEach(r => {
    for(let i=1; i<=cols; i++) {
        const id = `${r}${i}`;
        let initialStatus: Seat['status'] = 'available';
        
        if (id === 'D4') initialStatus = 'pending'; 
        else if (Math.random() < 0.15) initialStatus = 'booked';
        else if (Math.random() > 0.88) initialStatus = 'pending'; 
        
        initialSeats.push({ id, status: initialStatus });
    }
  });
  return initialSeats;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('boxoffice');
  const [seats, setSeats] = useState<Seat[]>(generateInitialSeats);
  const [cart, setCart] = useState<CartItem | null>({ seatId: 'D4', endTime: Date.now() + (4 * 60 * 1000 + 45 * 1000) });
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: 'TXN-8921', seatId: 'C5', date: 'Oct 24, 2023', status: 'BOOKED' },
    { id: 'TXN-8314', seatId: 'E2', date: 'Oct 12, 2023', status: 'CANCELED' },
    { id: 'TXN-7190', seatId: 'B8', date: 'Sep 29, 2023', status: 'BOOKED' },
  ]);

  const [seatToConfirm, setSeatToConfirm] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'danger', title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const openConfirmModal = (id: string) => {
    setSeatToConfirm(id);
  };

  const closeConfirmModal = () => {
    setSeatToConfirm(null);
  };

  const confirmSeatSelection = () => {
    if (!seatToConfirm) return;
    const id = seatToConfirm;
    
    setSeats(prev => prev.map(s => {
      if (s.id === cart?.seatId && s.status === 'pending') {
        return { ...s, status: 'available' };
      }
      if (s.id === id) {
        return { ...s, status: 'pending' };
      }
      return s;
    }));
    
    setCart({
      seatId: id,
      endTime: Date.now() + HOLD_DURATION_MS
    });
    
    closeConfirmModal();
    setActiveTab('mytickets');
    showToast('success', 'Seat On Hold', `Seat ${id} reserved for 5 minutes.`);
  };

  const payCart = () => {
    if(!cart) return;
    const seatId = cart.seatId;
    
    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, status: 'booked' } : s));
    
    setHistory(prev => [{
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      seatId: seatId,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'BOOKED'
    }, ...prev]);

    setCart(null);
    showToast('success', 'Payment Successful', `Ticket for seat ${seatId} confirmed.`);
  };

  const releaseCart = (isExpired = false) => {
    if(!cart) return;
    const seatId = cart.seatId;
    
    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, status: 'available' } : s));
    
    setHistory(prev => [{
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      seatId: seatId,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'CANCELED'
    }, ...prev]);

    setCart(null);
    
    if (isExpired) {
      showToast('danger', 'Hold Expired', `Seat ${seatId} has been released back to public.`);
    }
  };

  const handleUpdateSeatStatus = (seatId: string, isBooked: boolean) => {
    setSeats((prev) => prev.map(s => s.id === seatId ? { ...s, status: isBooked ? 'booked' : 'available' } : s));
  };

  // Needed in case cart timer expires implicitly
  useEffect(() => {
    if (!cart) return;
    const timer = setInterval(() => {
      if (cart.endTime <= Date.now()) {
         releaseCart(true);
      }
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
