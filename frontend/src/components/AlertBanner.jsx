import React, { useEffect, useState } from 'react';
import { Bell, AlertTriangle, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AlertBanner() {
  const [alerts, setAlerts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
     // Mocking Alerts to show carousel functionality
     setAlerts([
        { id: "A1", type: "GATE_DELAY", message: "North Gate experiencing 20 min delay due to security queue." },
        { id: "A2", type: "CROWD_HIGH", message: "Zone 1 Concourse is heavily congested. Use alternate routes." },
        { id: "A3", type: "EVENT_UPDATE", message: "Match resumes in 5 minutes! Return to your seats." }
     ]);
  }, []);

  if (!alerts.length || !isVisible) return null;

  const handleNext = () => setCurrentIndex((idx) => (idx + 1) % alerts.length);
  const handlePrev = () => setCurrentIndex((idx) => (idx - 1 + alerts.length) % alerts.length);

  const currentAlert = alerts[currentIndex];

  return (
    <div className="w-full relative px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md z-30 shrink-0 select-none overflow-hidden group">
      
      <div className="flex items-center justify-between max-w-7xl mx-auto cursor-pointer" onClick={handleNext}>
          <div className="flex items-center justify-center flex-1 space-x-2">
            {alerts.length > 1 && (
               <button onClick={(e) => { e.stopPropagation(); handlePrev() }} className="p-1 hover:bg-white/20 rounded-full transition-colors hidden sm:block">
                  <ChevronLeft className="w-4 h-4" />
               </button>
            )}
            
            <div className="flex items-center text-[13px] font-bold w-full max-w-2xl px-2">
              {currentAlert.type.includes('HIGH') || currentAlert.type.includes('DELAY') ? (
                <AlertTriangle className="w-4 h-4 mr-2 shrink-0 animate-pulse text-yellow-200" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              )}
              <span className="truncate flex-1 tracking-wide">{currentAlert.message}</span>
            </div>

            {alerts.length > 1 && (
               <div className="flex items-center space-x-2">
                 <span className="text-[10px] font-bold bg-black/20 px-1.5 py-0.5 rounded-md hidden sm:block">{currentIndex + 1} / {alerts.length}</span>
                 <button onClick={(e) => { e.stopPropagation(); handleNext() }} className="p-1 hover:bg-white/20 rounded-full transition-colors hidden sm:block">
                    <ChevronRight className="w-4 h-4" />
                 </button>
               </div>
            )}
          </div>
          
          <button 
             onClick={(e) => { e.stopPropagation(); setIsVisible(false); }} 
             className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors opacity-80 hover:opacity-100"
          >
             <X className="w-4 h-4" />
          </button>
      </div>

      {/* Auto cycle bar mock visual */}
      {alerts.length > 1 && <div className="absolute bottom-0 left-0 h-[2px] bg-white/30 w-full"><div className="h-full bg-white animate-[progress_5s_linear_infinite]" style={{width: '20%'}}></div></div>}
    </div>
  );
}
