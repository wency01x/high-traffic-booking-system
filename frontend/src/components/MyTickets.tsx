import { useEffect, useState } from 'react';
import type { CartItem, HistoryItem } from '../types';

interface MyTicketsProps {
  cart: CartItem | null;
  history: HistoryItem[];
  onRelease: () => void;
  onPay: () => void;
  onGoToBoxOffice: () => void;
}

export function MyTickets({ cart, history, onRelease, onPay, onGoToBoxOffice }: MyTicketsProps) {
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!cart) {
      setTimeLeft('--:--');
      setIsUrgent(false);
      return;
    }

    const timer = setInterval(() => {
      const diff = cart.endTime - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        onRelease(); // Auto release handled by context/parent usually, or we can just call onRelease here
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        setIsUrgent(diff < 60000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [cart, onRelease]);

  return (
    <div className="w-full flex-col lg:flex-row gap-8 lg:gap-12 animate-fadeIn flex">
      {/* Active Cart Column */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 sm:gap-5">
        <h2 className="text-xl sm:text-2xl tracking-tight font-space-grotesk font-medium text-white">Active Checkout</h2>
        <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-5 sm:p-6 flex flex-col shadow-[0_0_40px_rgba(16,185,129,0.03)] relative overflow-hidden">
          {cart ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <iconify-icon icon="solar:ticket-sale-linear" class="text-emerald-400 text-xl sm:text-2xl"></iconify-icon>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-medium mb-0.5 sm:mb-1">Pending Ticket</p>
                  <p className="text-lg sm:text-xl font-mono text-emerald-400 font-medium leading-none">Seat {cart.seatId}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 bg-[#111] px-4 sm:px-5 py-4 sm:py-5 rounded-sm border border-amber-500/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)] mb-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
                <iconify-icon icon="solar:stopwatch-linear" class={`${isUrgent ? 'text-rose-500' : 'text-amber-400'} text-xl sm:text-2xl relative z-10`}></iconify-icon>
                <div className="flex flex-col relative z-10">
                  <span className={`text-[8px] sm:text-[10px] uppercase tracking-widest ${isUrgent ? 'text-rose-500' : 'text-amber-500/70'} font-medium mb-0.5`}>Time Remaining</span>
                  <span className={`font-mono text-2xl sm:text-3xl ${isUrgent ? 'text-rose-500' : 'text-amber-400'} font-medium tracking-tight leading-none tabular-nums`}>{timeLeft}</span>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
                <button onClick={() => onRelease()} className="flex-1 py-3 border border-white/10 hover:border-white/30 text-gray-300 hover:text-white transition-all text-[10px] sm:text-xs font-medium uppercase tracking-widest rounded-sm bg-white/5 hover:bg-white/10">Release</button>
                <button onClick={() => onPay()} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black transition-all text-[10px] sm:text-xs font-medium uppercase tracking-widest rounded-sm flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  Pay Now <iconify-icon icon="solar:arrow-right-linear" class="group-hover:translate-x-1 transition-transform"></iconify-icon>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center opacity-60">
              <iconify-icon icon="solar:ticket-linear" class="text-3xl sm:text-4xl text-gray-600 mb-4"></iconify-icon>
              <p className="text-xs sm:text-sm font-medium text-gray-300 mb-1">No active checkout</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Select a seat from the Box Office to begin.</p>
              <button onClick={onGoToBoxOffice} className="mt-5 sm:mt-6 px-4 py-2 border border-white/10 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-gray-400 hover:text-white rounded-sm transition-colors">Go to Box Office</button>
            </div>
          )}
        </div>
      </div>

      {/* History Column */}
      <div className="w-full lg:w-2/3 flex flex-col gap-4 sm:gap-5">
        <h2 className="text-xl sm:text-2xl tracking-tight font-space-grotesk font-medium text-white">Booking History</h2>
        <div className="bg-[#0A0A0A] border border-white/5 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[400px]">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-4 sm:px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-widest">ID</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-widest">Seat</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-widest">Date</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map(item => {
                  const isBooked = item.status === 'BOOKED';
                  const badgeClass = isBooked 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors whitespace-nowrap">
                      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-mono text-gray-400">{item.id}</td>
                      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-mono text-white">{item.seatId}</td>
                      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-400">{item.date}</td>
                      <td className="px-4 sm:px-6 py-4 text-xs font-medium">
                        <span className={`px-2 py-1 rounded-sm border ${badgeClass} tracking-widest uppercase text-[9px] sm:text-[10px]`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
