import { useState } from 'react';

interface AdminPanelProps {
  onShowToast: (type: 'success' | 'danger', title: string, message: string) => void;
  // Made optional so App.tsx doesn't break, but we don't need to use it here anymore!
  onUpdateSeatStatus?: (seatId: string, isBooked: boolean) => void; 
}

export function AdminPanel({ onShowToast }: AdminPanelProps) {
  // States for creating a User
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // States for creating a Seat
  const [seatIdInput, setSeatIdInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- API CALL: Create a new User in PostgreSQL ---
  const handleCreateUser = async () => {
    if (!userName || !userEmail) {
      onShowToast('danger', 'Missing Info', 'Please provide both name and email.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8001/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName, email: userEmail })
      });

      if (response.ok) {
        onShowToast('success', 'User Created', `${userName} has been added to the database.`);
        setUserName('');
        setUserEmail('');
      } else {
        onShowToast('danger', 'Error', 'Failed to create user. Email might already exist.');
      }
    } catch (error) {
      onShowToast('danger', 'Connection Error', 'Could not reach the Python server.');
    }
  };

  // --- API CALL: Create a Single Seat ---
  const handleCreateSeat = async () => {
    if (!seatIdInput) {
      onShowToast('danger', 'Invalid ID', 'Please enter a valid seat identifier.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8001/seats/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: seatIdInput.toUpperCase() }) 
      });

      if (response.ok) {
        onShowToast('success', 'Seat Created', `Seat ${seatIdInput.toUpperCase()} added to database.`);
        setSeatIdInput('');
      } else {
        onShowToast('danger', 'Error', 'Seat might already exist!');
      }
    } catch (error) {
      onShowToast('danger', 'Connection Error', 'Could not reach the Python server.');
    }
  };

  // --- GOD MODE: Auto-Generate the entire theater ---
  const handleGenerateTheater = async () => {
    setIsGenerating(true);
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    let successCount = 0;

    onShowToast('success', 'Building Theater...', 'Sending 48 requests to FastAPI...');

    for (const r of rows) {
      for (let i = 1; i <= 8; i++) {
        try {
          const res = await fetch('http://127.0.0.1:8001/seats/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: `${r}${i}` })
          });
          if (res.ok) successCount++;
        } catch (e) {
          console.error("Failed to create seat", `${r}${i}`);
        }
      }
    }
    
    setIsGenerating(false);
    onShowToast('success', 'Theater Complete!', `Successfully built ${successCount} seats in the database.`);
  };

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
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. John Doe" 
                className="w-full bg-[#111] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:bg-white/5 outline-none transition-all placeholder:text-gray-600" 
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="john@example.com" 
                className="w-full bg-[#111] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:bg-white/5 outline-none transition-all placeholder:text-gray-600" 
              />
            </div>
            <button 
              onClick={handleCreateUser} 
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-medium uppercase tracking-widest rounded-sm transition-all mt-2 flex items-center justify-center gap-2"
            >
              <iconify-icon icon="solar:user-plus-linear" class="text-lg"></iconify-icon> Add User to Database
            </button>
          </div>
        </div>
      </div>

      {/* Create Seat Form */}
      <div className="flex flex-col gap-4 sm:gap-5 pt-0 md:pt-[52px] w-full">
        <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-5 sm:p-6 flex flex-col gap-5 relative overflow-hidden">
          <h3 className="text-base sm:text-lg tracking-tight font-space-grotesk font-medium text-gray-200 border-b border-white/5 pb-4">Manage Theater Layout</h3>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">Create Single Seat</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. A1" 
                  value={seatIdInput}
                  onChange={(e) => setSeatIdInput(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:bg-white/5 outline-none transition-all placeholder:text-gray-600 font-mono" 
                />
                <button 
                  onClick={handleCreateSeat} 
                  className="px-6 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-sm transition-all"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#0A0A0A] text-gray-500 uppercase tracking-widest">Or God Mode</span>
              </div>
            </div>

            <button 
              onClick={handleGenerateTheater}
              disabled={isGenerating}
              className={`px-4 py-3 ${isGenerating ? 'bg-emerald-500/20 text-emerald-500/50' : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'} text-xs font-bold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 border border-emerald-500/30`}
            >
              <iconify-icon icon="solar:magic-stick-3-linear" class="text-lg"></iconify-icon> 
              {isGenerating ? 'Building Database...' : 'Auto-Generate Full Theater (A1-F8)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}