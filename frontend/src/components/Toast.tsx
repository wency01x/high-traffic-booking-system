import type { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
}

export function Toast({ toasts }: ToastProps) {
  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:top-20 sm:right-6 sm:w-[350px] transition-all duration-300 ease-out z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const colors = isSuccess ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30';
        const iconColor = isSuccess ? 'text-emerald-500' : 'text-rose-500';
        const iconName = isSuccess ? 'solar:check-circle-linear' : 'solar:danger-triangle-linear';

        return (
          <div key={toast.id} className={`${colors} border backdrop-blur-xl px-4 sm:px-5 py-3 sm:py-4 rounded-sm flex items-start gap-3 sm:gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] animate-fadeIn`}>
            <iconify-icon icon={iconName} class={`${iconColor} text-xl sm:text-2xl mt-0.5 shrink-0`}></iconify-icon>
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-white mb-0.5 sm:mb-1 tracking-wide">{toast.title}</h4>
              <p className="text-[10px] sm:text-xs text-gray-400">{toast.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
