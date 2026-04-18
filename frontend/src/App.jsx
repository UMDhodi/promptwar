import React, { useState, useEffect } from 'react';
import ChatAssistant from './components/ChatAssistant';
import VenueMap from './components/VenueMap';
import WaitTimeDashboard from './components/WaitTimeDashboard';
import AlertBanner from './components/AlertBanner';
import AccessibilityToggle from './components/AccessibilityToggle';
import OnboardingModal from './components/OnboardingModal';
import { User, MapPin } from 'lucide-react';

function App() {
  const [isAccessible, setIsAccessible] = useState(false);
  const [activeTab, setActiveTab] = useState('map'); // mobile tab state
  const [mapHighlight, setMapHighlight] = useState(null);
  
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [userContext, setUserContext] = useState({ seat_number: "Unknown", accessibility_needs: false });

  useEffect(() => {
    // Check localStorage
    const savedSeat = localStorage.getItem('userSeat');
    const savedAccess = localStorage.getItem('userNeedsAccess');
    if (savedSeat) {
      setShowOnboarding(false);
      const acc = savedAccess === 'true';
      setIsAccessible(acc);
      setUserContext({ seat_number: savedSeat, accessibility_needs: acc });
    }
  }, []);

  const handleOnboardingComplete = (data) => {
    setIsAccessible(data.needsAccess);
    setUserContext({ seat_number: data.seat, accessibility_needs: data.needsAccess });
    setShowOnboarding(false);
  };

  // Sync manual accessibility toggle with user profile
  const handleToggleAccess = () => {
    const newAccess = !isAccessible;
    setIsAccessible(newAccess);
    localStorage.setItem('userNeedsAccess', JSON.stringify(newAccess));
    setUserContext(prev => ({...prev, accessibility_needs: newAccess}));
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col overflow-hidden font-sans">
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      <AlertBanner />
      
      {/* Top Navigation / App Bar */}
      <header className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-lg shadow-inner">
            IQ
          </div>
          <div className="hidden sm:block">
             <h1 className="text-lg font-bold leading-tight">StadiumIQ</h1>
             <p className="text-[10px] text-blue-200 font-medium tracking-wide uppercase">Apex Arena</p>
          </div>
        </div>

        {/* Hardcoded Match Info Layer */}
        <div className="flex-1 text-center hidden md:flex flex-col items-center justify-center">
            <span className="text-sm font-bold opacity-90"><span className="text-red-400 font-black">LIVE</span> | Cricket Match • 2nd Innings</span>
            <span className="text-xs text-blue-200 font-mono tracking-widest mt-0.5 opacity-80">14:32 REMAINING</span>
        </div>

        <div className="flex items-center space-x-3 h-full">
           <AccessibilityToggle isAccessible={isAccessible} onToggle={handleToggleAccess} />
           
           <div className="hidden sm:flex flex-col items-end border-l border-white/20 pl-3">
              <span className="text-xs font-semibold flex items-center"><User className="w-3 h-3 mr-1" /> Attendee</span>
              <span className="text-[10px] text-blue-200 font-mono flex items-center mt-0.5 bg-blue-800/50 px-1.5 rounded"><MapPin className="w-2 h-2 mr-1"/> {userContext.seat_number}</span>
           </div>
        </div>
      </header>

      {/* Main Content Area - Responsive Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LEFT/BOTTOM: Assistant */}
        <div className={`md:w-[350px] lg:w-[400px] shrink-0 border-r border-gray-200 z-10 flex flex-col bg-white ${activeTab === 'assistant' ? 'block absolute inset-0' : 'hidden md:flex'}`}>
           <ChatAssistant userContext={userContext} onMapHighlight={setMapHighlight} />
        </div>

        {/* MIDDLE: Venue Map */}
        <div className={`flex-1 relative ${activeTab === 'map' ? 'block' : 'hidden md:block'}`}>
           <VenueMap mapHighlight={mapHighlight} isAccessibleFilter={isAccessible} isBlocked={showOnboarding} />
        </div>

        {/* RIGHT: Status Dashboard */}
        <div className={`md:w-[320px] shrink-0 border-l border-gray-200 z-10 flex flex-col bg-white ${activeTab === 'dashboard' ? 'block absolute inset-0' : 'hidden md:flex'}`}>
           <WaitTimeDashboard isAccessibleFilter={isAccessible} />
        </div>
        
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <div className="md:hidden flex shrink-0 border-t border-gray-200 bg-white">
         <button onClick={() => setActiveTab('map')} className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === 'map' ? 'text-blue-600 border-t-2 border-blue-600 bg-blue-50/50' : 'text-gray-500'}`}>
           MAP
         </button>
         <button onClick={() => setActiveTab('assistant')} className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === 'assistant' ? 'text-blue-600 border-t-2 border-blue-600 bg-blue-50/50' : 'text-gray-500'}`}>
           ASSISTANT
         </button>
         <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === 'dashboard' ? 'text-blue-600 border-t-2 border-blue-600 bg-blue-50/50' : 'text-gray-500'}`}>
           DASHBOARD
         </button>
      </div>

    </div>
  );
}

export default App;
