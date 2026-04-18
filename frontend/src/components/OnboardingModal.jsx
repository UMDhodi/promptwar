import React, { useState } from 'react';

export default function OnboardingModal({ onComplete }) {
  const [seat, setSeat] = useState('');
  const [needsAccess, setNeedsAccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalSeat = seat.trim() || 'General Admission';
    localStorage.setItem('userSeat', finalSeat);
    localStorage.setItem('userNeedsAccess', JSON.stringify(needsAccess));
    onComplete({ seat: finalSeat, needsAccess });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/80 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-fade-in-up">
        <div className="flex justify-center mb-4">
           <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-2xl text-white shadow-inner">
             IQ
           </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Welcome to Apex Arena!</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Enter your seat section:</label>
            <input 
              type="text" 
              placeholder="e.g. Z2" 
              className="w-full bg-gray-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 border border-gray-200 transition-all text-sm"
              value={seat}
              onChange={(e) => setSeat(e.target.value)}
            />
          </div>

          <label className="flex items-start space-x-3 cursor-pointer group p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
            <div className="relative flex items-start pt-0.5">
              <input 
                type="checkbox" 
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                checked={needsAccess}
                onChange={(e) => setNeedsAccess(e.target.checked)}
              />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-800">I need accessible routes</span>
            </div>
          </label>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all mt-2"
          >
            Enter Stadium
          </button>
        </form>
      </div>
    </div>
  );
}
