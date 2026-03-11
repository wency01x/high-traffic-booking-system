

interface ConfirmModalProps {
  seatId: string | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ seatId, isOpen, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
      <div className="bg-[#0A0A0A] border border-white/10 p-6 md:p-8 rounded-lg max-w-sm w-full shadow-2xl transition-transform duration-300 scale-100">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
          <iconify-icon icon="solar:ticket-linear" class="text-emerald-400 text-2xl"></iconify-icon>
        </div>
        <h3 className="text-xl tracking-tight font-space-grotesk font-medium text-white mb-2">Confirm Selection</h3>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          Are you sure you want to hold seat <span className="text-emerald-400 font-mono font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">{seatId}</span>? You will have 5 minutes to complete the checkout process.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 py-3 text-xs font-medium uppercase tracking-widest text-gray-400 border border-white/10 rounded-sm hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-medium uppercase tracking-widest rounded-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            Hold Seat
          </button>
        </div>
      </div>
    </div>
  );
}
