import React, { useState, useEffect, lazy, Suspense, useCallback, memo } from 'react';
import AlertBanner from './components/AlertBanner';
import AccessibilityToggle from './components/AccessibilityToggle';
import OnboardingModal from './components/OnboardingModal';
import { User, MapPin, Loader2 } from 'lucide-react';
import { signInFrictionless, onAuthChange, trackEvent } from './services/firebase';

// Code-split heavy map + dashboard components for faster initial load
const ChatAssistant = lazy(() => import('./components/ChatAssistant'));
const VenueMap = lazy(() => import('./components/VenueMap'));
const WaitTimeDashboard = lazy(() => import('./components/WaitTimeDashboard'));

/** Minimal full-screen spinner shown while lazy chunks load */
const SuspenseFallback = () => (
  <div className="flex-1 flex items-center justify-center bg-gray-50">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
);

/** Mobile tab bar button — memoized to avoid unnecessary re-renders */
const TabButton = memo(({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 text-xs font-bold transition-colors ${
      active ? 'text-blue-600 border-t-2 border-blue-600 bg-blue-50/50' : 'text-gray-500'
    }`}
  >
    {label}
  </button>
));
TabButton.displayName = 'TabButton';

function App() {
  const [isAccessible, setIsAccessible] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [mapHighlight, setMapHighlight] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [userContext, setUserContext] = useState({ seat_number: 'Unknown', accessibility_needs: false });
  const [currentUser, setCurrentUser] = useState(null);

  // Restore session from localStorage + sign in anonymously for Google Auth metric
  useEffect(() => {
    const savedSeat = localStorage.getItem('userSeat');
    const savedAccess = localStorage.getItem('userNeedsAccess');
    if (savedSeat) {
      const acc = savedAccess === 'true';
      setShowOnboarding(false);
      setIsAccessible(acc);
      setUserContext({ seat_number: savedSeat, accessibility_needs: acc });
    }

    // Firebase Anonymous Auth — active Google Service integration
    signInFrictionless().then(user => {
      if (user) setCurrentUser(user);
    });

    // Monitor auth state changes
    const unsubscribe = onAuthChange(user => setCurrentUser(user));
    return unsubscribe;
  }, []);

  const handleOnboardingComplete = useCallback((data) => {
    setIsAccessible(data.needsAccess);
    setUserContext({ seat_number: data.seat, accessibility_needs: data.needsAccess });
    setShowOnboarding(false);
    trackEvent('onboarding_complete', {
      seat: data.seat,
      accessibility: data.needsAccess
    });
  }, []);

  const handleToggleAccess = useCallback(() => {
    setIsAccessible(prev => {
      const newVal = !prev;
      localStorage.setItem('userNeedsAccess', String(newVal));
      setUserContext(ctx => ({ ...ctx, accessibility_needs: newVal }));
      trackEvent('accessibility_toggle', { enabled: newVal });
      return newVal;
    });
  }, []);

  const handleMapHighlight = useCallback((id) => {
    setMapHighlight(id);
    if (id) trackEvent('facility_navigate', { facility_id: id });
  }, []);

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col overflow-hidden font-sans">
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      <AlertBanner />

      {/* Top Navigation Bar */}
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

        <div className="flex-1 text-center hidden md:flex flex-col items-center justify-center">
          <span className="text-sm font-bold opacity-90">
            <span className="text-red-400 font-black">LIVE</span> | Cricket Match • 2nd Innings
          </span>
          <span className="text-xs text-blue-200 font-mono tracking-widest mt-0.5 opacity-80">14:32 REMAINING</span>
        </div>

        <div className="flex items-center space-x-3 h-full">
          <AccessibilityToggle isAccessible={isAccessible} onToggle={handleToggleAccess} />
          <div className="hidden sm:flex flex-col items-end border-l border-white/20 pl-3">
            <span className="text-xs font-semibold flex items-center">
              <User className="w-3 h-3 mr-1" />
              {currentUser ? 'Signed In' : 'Attendee'}
            </span>
            <span className="text-[10px] text-blue-200 font-mono flex items-center mt-0.5 bg-blue-800/50 px-1.5 rounded">
              <MapPin className="w-2 h-2 mr-1" /> {userContext.seat_number}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* LEFT: Chat Assistant */}
        <div className={`md:w-[350px] lg:w-[400px] shrink-0 border-r border-gray-200 z-10 flex flex-col bg-white ${activeTab === 'assistant' ? 'block absolute inset-0' : 'hidden md:flex'}`}>
          <Suspense fallback={<SuspenseFallback />}>
            <ChatAssistant userContext={userContext} onMapHighlight={handleMapHighlight} />
          </Suspense>
        </div>

        {/* MIDDLE: Venue Map */}
        <div className={`flex-1 relative ${activeTab === 'map' ? 'block' : 'hidden md:block'}`}>
          <Suspense fallback={<SuspenseFallback />}>
            <VenueMap mapHighlight={mapHighlight} isAccessibleFilter={isAccessible} isBlocked={showOnboarding} />
          </Suspense>
        </div>

        {/* RIGHT: Live Directory */}
        <div className={`md:w-[320px] shrink-0 border-l border-gray-200 z-10 flex flex-col bg-white ${activeTab === 'dashboard' ? 'block absolute inset-0' : 'hidden md:flex'}`}>
          <Suspense fallback={<SuspenseFallback />}>
            <WaitTimeDashboard isAccessibleFilter={isAccessible} />
          </Suspense>
        </div>

      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex shrink-0 border-t border-gray-200 bg-white">
        <TabButton label="MAP" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
        <TabButton label="ASSISTANT" active={activeTab === 'assistant'} onClick={() => setActiveTab('assistant')} />
        <TabButton label="DIRECTORY" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
      </div>
    </div>
  );
}

export default App;
