import React, { useEffect, useState } from 'react';
import { getWaitTimes } from '../services/firebaseConfig';

const StadiumMap = () => {
  const [waitTimes, setWaitTimes] = useState({});

  useEffect(() => {
    // Poll our firebase simulation
    const fetchTimes = async () => {
      const times = await getWaitTimes();
      setWaitTimes(times);
    };
    fetchTimes();
    const interval = setInterval(fetchTimes, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (time) => {
    if (!time) return "status-green";
    if (time > 10) return "status-red";
    if (time > 5) return "status-yellow";
    return "status-green";
  };

  return (
    <div className="glass-panel stadium-map">
      <h2 style={{ marginBottom: '1rem' }}>Live Stadium Traffic</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Interactive map simulating Google Maps & Firebase Data Overlay.
      </p>
      
      <div className="stadium-visual">
        {/* Mock Zones for the Map Interface */}
        
        <div className={`zone-marker ${getStatusColor(waitTimes["Burger King B"])}`} style={{ top: '20%', left: '20%' }}>
          <span className="zone-icon">🍔</span>
          <span>Food B</span>
          <span className="zone-wait">{waitTimes["Burger King B"] || '--'} min</span>
        </div>

        <div className={`zone-marker ${getStatusColor(waitTimes["Burger King A"])}`} style={{ top: '70%', left: '70%' }}>
          <span className="zone-icon">🍔</span>
          <span>Food A</span>
          <span className="zone-wait">{waitTimes["Burger King A"] || '--'} min</span>
        </div>

        <div className={`zone-marker ${getStatusColor(waitTimes["Restroom North"])}`} style={{ top: '20%', right: '20%' }}>
          <span className="zone-icon">🚻</span>
          <span>RR North</span>
          <span className="zone-wait">{waitTimes["Restroom North"] || '--'} min</span>
        </div>

        <div className={`zone-marker ${getStatusColor(waitTimes["Restroom South"])}`} style={{ bottom: '20%', left: '40%' }}>
          <span className="zone-icon">🚻</span>
          <span>RR South</span>
          <span className="zone-wait">{waitTimes["Restroom South"] || '--'} min</span>
        </div>

        <div className={`zone-marker ${getStatusColor(waitTimes["Exit Gate 1"])}`} style={{ top: '45%', left: '5%' }}>
          <span className="zone-icon">🚪</span>
          <span>Gate 1</span>
          <span className="zone-wait">{waitTimes["Exit Gate 1"] || '--'} min</span>
        </div>

        <div className={`zone-marker ${getStatusColor(waitTimes["Exit Gate 2"])}`} style={{ top: '45%', right: '5%' }}>
          <span className="zone-icon">🚪</span>
          <span>Gate 2</span>
          <span className="zone-wait">{waitTimes["Exit Gate 2"] || '--'} min</span>
        </div>

        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--accent-color)',
          padding: '1rem 3rem',
          borderRadius: '50px',
          border: '2px solid white',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
        }}>
          <b>Pitch</b>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span>Powered by Google Maps 📍</span>
        <span>Firebase Status Live ⚡</span>
      </div>
    </div>
  );
};

export default StadiumMap;
