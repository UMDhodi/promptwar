import React from 'react';
import { Ticket, MapPin, Clock } from 'lucide-react';

const ContextPanel = () => {
  return (
    <div className="glass-panel context-panel">
      <div>
        <h2 style={{ marginBottom: '0.2rem' }}>Your Pass</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>VIP Access</p>
      </div>
      
      <div className="context-item">
        <div className="context-icon">
          <Ticket size={20} />
        </div>
        <div className="context-info">
          <p>Current Seat</p>
          <h3>Sector 112, Row K</h3>
        </div>
      </div>
      
      <div className="context-item">
        <div className="context-icon">
          <MapPin size={20} />
        </div>
        <div className="context-info">
          <p>Nearest Exit</p>
          <h3>Gate 1 (2 min walk)</h3>
        </div>
      </div>

      <div className="context-item" style={{ marginTop: 'auto' }}>
        <div className="context-icon" style={{ background: 'var(--warning)' }}>
          <Clock size={20} color="#fff" />
        </div>
        <div className="context-info">
          <p>Match Event</p>
          <h3>Halftime in 12 mins</h3>
        </div>
      </div>
    </div>
  );
};

export default ContextPanel;
