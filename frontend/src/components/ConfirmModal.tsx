interface ConfirmModalProps {
  isOpen: boolean;
  seatIds: string[]; // <-- Changed from seatId: string | null
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, seatIds, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen || seatIds.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-lg max-w-sm w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4 text-emerald-400">
          <iconify-icon icon="solar:ticket-bold" class="text-2xl"></iconify-icon>
          <h3 className="text-lg font-space-grotesk font-bold tracking-tight text-white">Hold Tickets</h3>
        </div>
        
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Are you sure you want to reserve <strong className="text-white">Seat{seatIds.length > 1 ? 's' : ''} {seatIds.join(', ')}</strong>? You will have 5 minutes to complete your payment.
        </p>

        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-widest rounded-sm transition-colors"
          >
            Confirm Hold
          </button>
        </div>
      </div>
    </div>
  );
}