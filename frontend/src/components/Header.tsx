

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasCart: boolean;
}

export function Header({ activeTab, setActiveTab, hasCart }: HeaderProps) {
  return (
    <header className="border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <iconify-icon icon="solar:ticket-linear" class="text-emerald-400 text-base sm:text-lg"></iconify-icon>
          </div>
          <span className="font-space-grotesk font-medium tracking-tight text-base sm:text-lg text-white">Lumière VIP</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">System Online</span>
          </div>
          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <iconify-icon icon="solar:user-linear" class="text-gray-500 hidden sm:block"></iconify-icon>
            <select className="bg-transparent border-none text-xs sm:text-sm font-medium text-gray-300 focus:ring-0 cursor-pointer outline-none appearance-none pr-2 sm:pr-4">
              <option value="user_1" className="bg-[#0A0A0A]">Customer #8492</option>
              <option value="user_2" className="bg-[#0A0A0A]">Customer #1023</option>
              <option value="user_3" className="bg-[#0A0A0A]">Admin User</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-4 sm:gap-6 text-sm font-medium border-t border-white/5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('boxoffice')}
          className={`py-3 whitespace-nowrap transition-colors ${activeTab === 'boxoffice' ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500 border-b-2 border-transparent hover:text-gray-300'}`}
        >
          Box Office
        </button>
        <button
          onClick={() => setActiveTab('mytickets')}
          className={`py-3 whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'mytickets' ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500 border-b-2 border-transparent hover:text-gray-300'}`}
        >
          My Tickets
          {hasCart && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`py-3 whitespace-nowrap transition-colors ${activeTab === 'admin' ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500 border-b-2 border-transparent hover:text-gray-300'}`}
        >
          Admin Panel
        </button>
      </div>
    </header>
  );
}
