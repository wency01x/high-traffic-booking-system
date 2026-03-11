import { useState } from 'react';

interface AdminPanelProps {
  onShowToast: (type: 'success' | 'danger', title: string, message: string) => void;
  onUpdateSeatStatus: (seatId: string, isBooked: boolean) => void;
}

export function AdminPanel({ onShowToast, onUpdateSeatStatus }: AdminPanelProps) {
  const [seatIdInput, setSeatIdInput] = useState('');
  const [isBooked, setIsBooked] = useState(false);

  return (
    <div className="w-full grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 animate-fadeIn grid">
      {/* Create User Form */}
      <div className="flex flex-col gap-4 sm:gap-5 w-full">
        <h2 className="text-xl sm:text-2xl tracking-tight font-space-grotesk font-medium text-white">System Admin</h2>
        <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-5 sm:p-6 flex flex-col gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <h3 className="text-base sm:text-lg tracking-tight font-space-grotesk font-medium text-gray-200 border-b border-white/5 pb-4">Create User</h3>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
              <input type="text" placeholder="e.g. John Doe" className="w-full bg-[#111] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:bg-white/5 outline-none transition-all placeholder:text-gray-600" />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" placeholder="john@example.com" className="w-full bg-[#111] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:bg-white/5 outline-none transition-all placeholder:text-gray-600" />
            </div>
            <button 
              onClick={() => onShowToast('success', 'User Created', 'New user has been added to the system.')} 
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-medium uppercase tracking-widest rounded-sm transition-all mt-2 flex items-center justify-center gap-2"
            >
              <iconify-icon icon="solar:user-plus-linear" class="text-lg"></iconify-icon> Add User
            </button>
          </div>
        </div>
      </div>

      {/* Create Seat Form */}
      <div className="flex flex-col gap-4 sm:gap-5 pt-0 md:pt-[52px] w-full">
        <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-5 sm:p-6 flex flex-col gap-5 relative overflow-hidden">
          <h3 className="text-base sm:text-lg tracking-tight font-space-grotesk font-medium text-gray-200 border-b border-white/5 pb-4">Manage Seat Status</h3>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">Seat Identifier</label>
              <input 
                type="text" 
                placeholder="e.g. A1" 
                value={seatIdInput}
                onChange={(e) => setSeatIdInput(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:bg-white/5 outline-none transition-all placeholder:text-gray-600 font-mono" 
              />
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex flex-col pr-4">
                <span className="text-sm font-medium text-gray-300">Set as Booked</span>
                <span className="text-[10px] sm:text-xs text-gray-500">Force seat status to unavailable</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isBooked}
                  onChange={(e) => setIsBooked(e.target.checked)}
                />
                <div className="w-11 h-6 bg-[#111] border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-500 peer-checked:after:bg-emerald-500 after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500/10 peer-checked:border-emerald-500/30"></div>
              </label>
            </div>

            <button 
              onClick={() => {
                if (seatIdInput) {
                  onUpdateSeatStatus(seatIdInput, isBooked);
                  onShowToast('success', 'Seat Updated', 'Seat configuration has been saved.');
                  setSeatIdInput('');
                } else {
                  onShowToast('danger', 'Invalid ID', 'Please enter a valid seat identifier.');
                }
              }} 
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-medium uppercase tracking-widest rounded-sm transition-all mt-2 flex items-center justify-center gap-2"
            >
              <iconify-icon icon="solar:server-square-update-linear" class="text-lg"></iconify-icon> Update Layout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
