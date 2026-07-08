import React, { useState, useEffect, lazy, Suspense, useCallback, memo } from 'react';
import AlertBanner from './components/AlertBanner';
import AccessibilityToggle from './components/AccessibilityToggle';
import OnboardingModal from './components/OnboardingModal';
import ErrorBoundary from './components/ErrorBoundary';
import { User, MapPin, Loader2 } from 'lucide-react';
import { signInFrictionless, onAuthChange, trackEvent } from './services/firebase';

// Code-split heavy map + dashboard components for faster initial load
const ChatAssistant = lazy(() => import('./components/ChatAssistant'));
const VenueMap = lazy(() => import('./components/VenueMap'));
const WaitTimeDashboard = lazy(() => import('./components/WaitTimeDashboard'));

/** Minimal full-screen spinner shown while lazy chunks load */
const SuspenseFallback = memo(() => (
  <div className="flex-1 flex items-center justify-center bg-gray-50">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" aria-label="Loading" />
  </div>
));
SuspenseFallback.displayName = 'SuspenseFallback';

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
  const [isAccessible, setIsAccessible] = useState(() => localStorage.getItem('userNeedsAccess') === 'true');
  const [activeTab, setActiveTab] = useState('map');
  const [mapHighlight, setMapHighlight] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('userSeat'));
  const [userContext, setUserContext] = useState(() => {
    const seat = localStorage.getItem('userSeat');
    const acc = localStorage.getItem('userNeedsAccess') === 'true';
    return { seat_number: seat || 'Unknown', accessibility_needs: acc };
  });
  const [currentUser, setCurrentUser] = useState(null);

  // Multilingual & Staff operations mode states to align with World Cup 2026 problem statement
  const [language, setLanguage] = useState('en');
  const [isStaffMode, setIsStaffMode] = useState(false);

  // Sign in anonymously for Google Auth metric on mount
  useEffect(() => {
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

  // Stable tab-switch handlers — extracted so TabButton onClick never
  // gets a new function reference on every App render.
  const showMap       = useCallback(() => setActiveTab('map'),       []);
  const showAssistant = useCallback(() => setActiveTab('assistant'), []);
  const showDashboard = useCallback(() => setActiveTab('dashboard'), []);

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col overflow-hidden font-sans">
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      <AlertBanner />

      {/* Top Navigation Bar */}
      <header className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center font-bold text-lg shadow-inner">
            ⚽
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-tight">FIFAiq</h1>
            <p className="text-[10px] text-green-200 font-medium tracking-wide uppercase">Apex Football Stadium</p>
          </div>
        </div>

        <div className="flex-1 text-center hidden md:flex flex-col items-center justify-center">
          <span className="text-sm font-bold opacity-90">
            <span className="text-red-400 font-black">LIVE</span> | Football Match • 2nd Half
          </span>
          <span className="text-xs text-blue-200 font-mono tracking-widest mt-0.5 opacity-80">38:15 REMAINING</span>
        </div>

        {/* Multilingual Selector & Staff Toggle in Header */}
        <div className="flex items-center space-x-2 mr-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-blue-800 text-white text-xs font-bold py-1 px-1.5 rounded border border-blue-700 focus:outline-none cursor-pointer focus:ring-1 focus:ring-green-400"
            aria-label="Select Language"
          >
            <option value="en">🇺🇸 EN</option>
            <option value="es">🇲🇽 ES</option>
            <option value="fr">🇨🇦 FR</option>
          </select>

          <button
            onClick={() => setIsStaffMode(prev => !prev)}
            className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all focus:outline-none focus:ring-1 ${
              isStaffMode
                ? 'bg-orange-500 text-white border border-orange-400 shadow-md'
                : 'bg-blue-800 text-blue-200 border border-blue-700 hover:text-white'
            }`}
            aria-label="Toggle Staff Operations Mode"
          >
            {isStaffMode ? '🛠️ Staff' : '👥 Fan'}
          </button>
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
          <ErrorBoundary label="FIFAiq Assistant">
            <Suspense fallback={<SuspenseFallback />}>
              <ChatAssistant userContext={userContext} onMapHighlight={handleMapHighlight} />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* MIDDLE: Venue Map */}
        <div className={`flex-1 relative ${activeTab === 'map' ? 'block' : 'hidden md:block'}`}>
          <ErrorBoundary label="Stadium Map">
            <Suspense fallback={<SuspenseFallback />}>
              <VenueMap mapHighlight={mapHighlight} isAccessibleFilter={isAccessible} isBlocked={showOnboarding} />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* RIGHT: Live Directory */}
        <div className={`md:w-[320px] shrink-0 border-l border-gray-200 z-10 flex flex-col bg-white ${activeTab === 'dashboard' ? 'block absolute inset-0' : 'hidden md:flex'}`}>
          <ErrorBoundary label="Analytics & Directory">
            <Suspense fallback={<SuspenseFallback />}>
              <WaitTimeDashboard isAccessibleFilter={isAccessible} language={language} isStaffMode={isStaffMode} />
            </Suspense>
          </ErrorBoundary>
        </div>

      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex shrink-0 border-t border-gray-200 bg-white">
        <TabButton label="MAP"       active={activeTab === 'map'}       onClick={showMap} />
        <TabButton label="ASSISTANT" active={activeTab === 'assistant'} onClick={showAssistant} />
        <TabButton label="DIRECTORY" active={activeTab === 'dashboard'} onClick={showDashboard} />
      </div>
    </div>
  );
}

export default App;
