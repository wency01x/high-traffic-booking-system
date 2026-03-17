import React from 'react';
import type { Seat, CartItem } from '../types';

interface BoxOfficeProps {
  seats: Seat[];
  cart: CartItem | null;
  onSeatClick: (id: string) => void;
}

export function BoxOffice({ seats, cart, onSeatClick }: BoxOfficeProps) {
  return (
    <div className="w-full flex flex-col items-center animate-fadeIn">
      {/* Screen Setup */}
      <div className="w-full max-w-2xl mb-10 sm:mb-16 flex flex-col items-center px-4 sm:px-0">
        <div className="w-full h-4 sm:h-8 cinema-screen"></div>
        <p className="text-[8px] sm:text-[10px] md:text-xs font-medium uppercase tracking-[0.3em] text-gray-600 mt-3 sm:mt-4">Cinemascope Screen</p>
      </div>

      {/* Seat Grid */}
      <div className="relative w-full pb-8 flex justify-center">
        <div className="grid gap-1.5 min-[375px]:gap-2 sm:gap-4 md:gap-5 w-full max-w-2xl" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr)) clamp(12px, 4vw, 24px) repeat(4, minmax(0, 1fr))' }}>
          {seats.map((seat, index) => {
            const isCartSeat = cart?.seatIds?.includes(seat.id);
            
            let btnClass = 'w-full aspect-square flex items-center justify-center font-mono text-[9px] min-[375px]:text-[10px] sm:text-xs md:text-sm rounded-t min-[375px]:rounded-t-lg transition-all duration-300 border relative group overflow-hidden focus:outline-none ';
            let content = null;

            if (seat.status === 'available') {
              btnClass += 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:shadow-[0_4px_15px_rgba(16,185,129,0.15)] cursor-pointer';
              content = <span className="relative z-10">{seat.id}</span>;
            } else if (seat.status === 'pending') {
              if (isCartSeat) {
                btnClass += 'border-amber-500 text-amber-300 bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)] -translate-y-0.5 sm:-translate-y-1 cursor-not-allowed';
                content = <span className="relative z-10">{seat.id}</span>;
              } else {
                btnClass += 'border-amber-500/50 text-amber-400 bg-amber-500/10 cursor-not-allowed';
                content = <><span className="relative z-10">{seat.id}</span><div className="absolute inset-0 bg-amber-500/10 animate-pulse"></div></>;
              }
            } else if (seat.status === 'booked') {
              btnClass += 'border-rose-500/20 text-rose-500/40 bg-rose-500/5 cursor-not-allowed';
              content = <><span className="opacity-40 z-10">{seat.id}</span><div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-px bg-rose-500/30 rotate-45"></div></div></>;
            } 
            // 👇 NEW: This handles the glowing green selected seats! 👇
            else if (seat.status === 'selected') {
              btnClass += 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)] cursor-pointer -translate-y-0.5 sm:-translate-y-1 font-bold';
              content = <span className="relative z-10">{seat.id}</span>;
            }

            return (
              <React.Fragment key={seat.id}>
                <button 
                  className={btnClass} 
                  // 👇 NEW: Allow clicking on both 'available' AND 'selected' seats (to unselect them)
                  onClick={() => (seat.status === 'available' || seat.status === 'selected') ? onSeatClick(seat.id) : undefined}
                >
                  {content}
                </button>
                {/* Aisle */}
                {(index + 1) % 8 === 4 && <div className="w-full h-full"></div>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 sm:gap-8 bg-white/5 border border-white/5 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-full backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-t-sm border border-emerald-500/30 bg-emerald-500/5"></div>
          <span className="text-[10px] sm:text-xs font-medium text-gray-400">Available</span>
        </div>
        
        {/* 👇 NEW: Added the Selected state to the Legend so users know what it means! 👇 */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-t-sm border border-emerald-400 bg-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.3)]"></div>
          <span className="text-[10px] sm:text-xs font-medium text-emerald-400">Selected</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-t-sm border border-amber-500/50 bg-amber-500/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-500/20 animate-pulse"></div>
          </div>
          <span className="text-[10px] sm:text-xs font-medium text-gray-400">On Hold</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-t-sm border border-rose-500/20 bg-rose-500/10 relative">
            <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-px bg-rose-500/40 rotate-45"></div></div>
          </div>
          <span className="text-[10px] sm:text-xs font-medium text-gray-400">Booked</span>
        </div>
      </div>
    </div>
  );
}