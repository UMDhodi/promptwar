import React from 'react';
import ContextPanel from './components/ContextPanel';
import StadiumMap from './components/StadiumMap';
import AssistantChat from './components/AssistantChat';

function App() {
  const mockUserContext = {
    seat: "Sector 112, Row K",
    tier: "VIP",
  };

  return (
    <>
      <header className="app-header">
        <h1>StadiumSync AI</h1>
        <p>Your Intelligent Event Companion</p>
      </header>
      
      <main className="dashboard-grid">
        <ContextPanel />
        <StadiumMap />
        <AssistantChat userContext={mockUserContext} />
      </main>
    </>
  );
}

export default App;
