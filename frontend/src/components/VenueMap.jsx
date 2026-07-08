import React, { useEffect, useState, useRef } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { ZoomIn, ZoomOut, Maximize, Navigation, Layers, Flame, Eye } from 'lucide-react';

/* ─────────────────────────────────────────────
   Colour helpers
───────────────────────────────────────────── */
const densityToColor = (pct) => {
  if (pct >= 90) return { fill: '#ef4444', label: '#fff', ring: '#dc2626' };
  if (pct >= 75) return { fill: '#f97316', label: '#fff', ring: '#ea580c' };
  if (pct >= 55) return { fill: '#eab308', label: '#000', ring: '#ca8a04' };
  return { fill: '#22c55e', label: '#fff', ring: '#16a34a' };
};

const waitColor = (wait) => {
  if (typeof wait === 'string') return '#6b7280';
  if (wait > 15) return '#ef4444';
  if (wait > 5)  return '#f59e0b';
  return '#22c55e';
};

const facilityEmoji = { Gates: '🚪', Concessions: '🍔', Restrooms: '🚻', Medical: '⛑️', Parking: '🅿️' };

/* ─────────────────────────────────────────────
   Fixed pixel positions for each facility type
   on a 900×900 canvas (football-stadium layout)
───────────────────────────────────────────── */
const POSITIONS = {
  Gates:       [{ x:450,y:55  }, { x:450,y:845 }, { x:855,y:450 }, { x:45, y:450 }],
  Concessions: [{ x:360,y:175 }, { x:450,y:755 }, { x:720,y:360 }, { x:180,y:540 }],
  Restrooms:   [{ x:540,y:175 }, { x:558,y:795 }, { x:720,y:540 }, { x:180,y:360 }],
  Medical:     [{ x:760,y:140 }, { x:225,y:770 }],
  Parking:     [{ x:760,y:35  }, { x:140,y:862 }],
};

const USER_POS = { x: 450, y: 790 };

/* Heatmap "hot-spots" per zone for canvas rendering */
const ZONE_HOTSPOTS = {
  Z1: [{ x: 450, y: 120 }, { x: 390, y: 100 }, { x: 510, y: 100 }],
  Z2: [{ x: 450, y: 775 }, { x: 395, y: 790 }, { x: 505, y: 790 }],
  Z3: [{ x: 780, y: 450 }, { x: 790, y: 395 }, { x: 790, y: 505 }],
  Z4: [{ x: 120, y: 450 }, { x: 110, y: 395 }, { x: 110, y: 505 }],
  Z5: [{ x: 450, y: 450 }],
};

/* Zone overlay shapes (SVG path data, 900×900 viewBox) */
const ZONE_PATHS = {
  Z1: 'M 250 50 Q 450 20 650 50 L 620 200 Q 450 175 280 200 Z',
  Z2: 'M 280 700 Q 450 725 620 700 L 650 850 Q 450 880 250 850 Z',
  Z3: 'M 700 280 L 850 250 Q 880 450 850 650 L 700 620 Q 725 450 700 280 Z',
  Z4: 'M 200 280 Q 175 450 200 620 L 50 650 Q 20 450 50 250 Z',
};

/* ─────────────────────────────────────────────
   Heatmap canvas renderer
───────────────────────────────────────────── */
function HeatmapCanvas({ zones, visible }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!visible || !canvasRef.current || !zones) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 900, 900);

    zones.forEach(zone => {
      if (!ZONE_HOTSPOTS[zone.id]) return;
      const density = zone.current_occupancy / zone.capacity;
      const r = Math.round(density > 0.75 ? 255 : density > 0.55 ? 255 : 34);
      const g = Math.round(density > 0.75 ? Math.max(0, 165 - density * 100) : density > 0.55 ? 165 : 197);
      const b = 34;
      const spots = ZONE_HOTSPOTS[zone.id];
      spots.forEach(({ x, y }) => {
        const radius = 110 + density * 60;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},${0.55 * density})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${0.25 * density})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }, [zones, visible]);

  return (
    <canvas
      ref={canvasRef}
      width={900} height={900}
      className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    />
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function VenueMap({ mapHighlight, isAccessibleFilter, isBlocked = false }) {
  const { venueData, loading } = useFirestore();

  const [zoom, setZoom]             = useState(1);
  const [offset, setOffset]         = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart]   = useState({ x: 0, y: 0 });
  const [activePopup, setActivePopup]       = useState(null);
  const [navigationTarget, setNavTarget]    = useState(null);
  const [showHeatmap, setShowHeatmap]       = useState(false);
  const [showZoneLabels, setShowZoneLabels] = useState(true);
  const [activeLayer, setActiveLayer]       = useState('density'); // 'density' | 'wait'

  /* Drag handlers */
  const handleMouseDown = (e) => { setIsDragging(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); };
  const handleMouseMove = (e) => { if (!isDragging) return; setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp   = () => setIsDragging(false);
  const resetMap        = () => { setZoom(1); setOffset({ x: 0, y: 0 }); setActivePopup(null); setNavTarget(null); };

  /* Sync highlight → navigation arrow */
  useEffect(() => {
    if (!mapHighlight || !venueData) { setNavTarget(null); return; }
    const cats   = ['gates','concessions','restrooms','medical_posts','parking'];
    const mapped = ['Gates','Concessions','Restrooms','Medical','Parking'];
    for (let i = 0; i < cats.length; i++) {
      const arr = venueData[cats[i]];
      if (arr) {
        const idx = arr.findIndex(f => f.id === mapHighlight);
        if (idx !== -1) {
          const pos = POSITIONS[mapped[i]][idx % POSITIONS[mapped[i]].length];
          setNavTarget({ id: mapHighlight, ...pos });
          return;
        }
      }
    }
  }, [mapHighlight, venueData]);

  if (loading || !venueData) return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-green-300 font-semibold text-sm tracking-widest uppercase">Loading Stadium…</span>
      </div>
    </div>
  );

  /* ── Facility marker ── */
  const renderMarker = (facility, type, pos) => {
    if (isAccessibleFilter && type === 'Restrooms' && !facility.accessible) return null;
    const isHighlighted = mapHighlight === facility.id || navigationTarget?.id === facility.id;
    const isOpen        = activePopup?.id === facility.id;
    const waitNum = facility.wait_minutes_to_exit ?? facility.wait_minutes ?? 0;
    let badge = '';
    if (type === 'Parking') badge = `${facility.available}`;
    else if (type === 'Medical') badge = facility.is_24hr ? '24h' : 'ON';
    else badge = `${waitNum}m`;
    const bColor = waitColor(type === 'Parking' || type === 'Medical' ? badge : waitNum);

    return (
      <div
        key={facility.id}
        className={`absolute cursor-pointer z-30 transition-all duration-300 select-none ${isHighlighted ? 'scale-[1.6] z-50' : 'hover:scale-125'}`}
        style={{ top: `${(pos.y / 900) * 100}%`, left: `${(pos.x / 900) * 100}%`, transform: 'translate(-50%,-50%)' }}
        onClick={() => setActivePopup(isOpen ? null : { ...facility, x: pos.x, y: pos.y, badge, type, waitNum })}
      >
        {isHighlighted && <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-60 scale-150" />}
        <div className="relative text-xl drop-shadow-lg bg-white/95 rounded-full p-1.5 shadow-md border border-gray-200 flex items-center justify-center">
          {facilityEmoji[type]}
          <div className="absolute -top-2.5 -right-2 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow z-40 whitespace-nowrap"
               style={{ backgroundColor: bColor }}>
            {badge}
          </div>
        </div>

        {isOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[125%] mb-2 w-52 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 p-3.5 z-50 text-center font-sans popup-entry">
            <div className="font-black text-[13px] text-gray-900 leading-tight">{facility.name || `${type} ${facility.id}`}</div>
            <div className="mt-1 text-[11px] font-bold" style={{ color: bColor }}>
              {type === 'Parking' ? `${facility.available} spots free` : type === 'Medical' ? (facility.is_24hr ? '24-hour Service' : 'Staffed Now') : `Queue: ${waitNum} min`}
            </div>
            {facility.accessible && <div className="text-[10px] text-blue-500 font-bold mt-0.5">♿ Accessible</div>}
            <button
              onClick={(e) => { e.stopPropagation(); setNavTarget({ id: facility.id, x: pos.x, y: pos.y }); setActivePopup(null); }}
              className="mt-2.5 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
            >
              <Navigation className="w-3 h-3" /> Navigate
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] border-4 border-transparent border-t-white" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="relative w-full h-full bg-slate-900 overflow-hidden"
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}     onMouseLeave={handleMouseUp}
    >
      {/* ── Controls ── */}
      {!isBlocked && (
        <>
          {/* Zoom */}
          <div className="absolute top-4 right-4 z-40 flex flex-col gap-1.5 bg-slate-800/90 backdrop-blur p-1.5 rounded-xl border border-slate-700 shadow-lg">
            <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors" onClick={() => setZoom(z => Math.min(z + 0.25, 3))}><ZoomIn className="w-4 h-4"/></button>
            <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}><ZoomOut className="w-4 h-4"/></button>
            <div className="h-px bg-slate-600 mx-1" />
            <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors" onClick={resetMap}><Maximize className="w-4 h-4"/></button>
          </div>

          {/* Layer toggles */}
          <div className="absolute top-4 left-4 z-40 flex flex-col gap-2">
            <button
              onClick={() => setShowHeatmap(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-md ${showHeatmap ? 'bg-orange-500 text-white border-orange-400' : 'bg-slate-800/90 text-slate-300 border-slate-600'}`}
            >
              <Flame className="w-3.5 h-3.5" /> Heatmap
            </button>
            <button
              onClick={() => setShowZoneLabels(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-md ${showZoneLabels ? 'bg-blue-500 text-white border-blue-400' : 'bg-slate-800/90 text-slate-300 border-slate-600'}`}
            >
              <Layers className="w-3.5 h-3.5" /> Zones
            </button>
            <button
              onClick={() => setActiveLayer(l => l === 'density' ? 'wait' : 'density')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800/90 text-slate-300 border border-slate-600 shadow-md hover:bg-slate-700 transition-all"
            >
              <Eye className="w-3.5 h-3.5" /> {activeLayer === 'density' ? 'Crowd %' : 'Wait Times'}
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-800/95 p-3 rounded-xl shadow-xl backdrop-blur border border-slate-700 z-40 min-w-[160px]">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
              {activeLayer === 'density' ? '🔥 Crowd Density' : '⏱ Wait Time'}
            </h4>
            {activeLayer === 'density' ? (
              <div className="flex flex-col gap-1.5 text-[11px] font-semibold text-slate-200">
                {[['bg-green-500','< 55%'],['bg-yellow-400 text-black','55–75%'],['bg-orange-500','75–90%'],['bg-red-500','> 90%']].map(([cls,lbl]) => (
                  <div key={lbl} className="flex items-center gap-2"><div className={`w-3.5 h-3.5 rounded-full ${cls} shadow-inner`}/>{lbl}</div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 text-[11px] font-semibold text-slate-200">
                {[['bg-green-500','< 5 min'],['bg-yellow-400 text-black','5–15 min'],['bg-red-500','> 15 min']].map(([cls,lbl]) => (
                  <div key={lbl} className="flex items-center gap-2"><div className={`w-3.5 h-3.5 rounded-full ${cls} shadow-inner`}/>{lbl}</div>
                ))}
              </div>
            )}
          </div>

          {/* Live badge */}
          <div className="absolute bottom-4 right-4 z-40 flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-300 shadow">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </>
      )}

      {/* ── Map canvas ── */}
      <div
        className="absolute inset-0 transition-transform duration-75 origin-center"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Centred 900×900 stage */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none">

          {/* ── SVG: realistic football stadium ── */}
          <svg viewBox="0 0 900 900" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Field grass gradient */}
              <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#2d6a2d"/>
                <stop offset="50%" stopColor="#1e5c1e"/>
                <stop offset="100%" stopColor="#2d6a2d"/>
              </linearGradient>
              {/* Stands gradient */}
              <radialGradient id="standGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%"  stopColor="#1e293b"/>
                <stop offset="100%" stopColor="#0f172a"/>
              </radialGradient>
              {/* Track gradient */}
              <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"  stopColor="#7c3aed"/>
                <stop offset="100%" stopColor="#6d28d9"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.5"/>
              </filter>
            </defs>

            {/* ── Background ── */}
            <rect width="900" height="900" fill="#0f172a"/>

            {/* ── Outer stadium shell ── */}
            <ellipse cx="450" cy="450" rx="420" ry="420" fill="#1e293b" stroke="#334155" strokeWidth="4" filter="url(#shadow)"/>

            {/* ── Running track ring ── */}
            <ellipse cx="450" cy="450" rx="370" ry="350" fill="url(#trackGrad)" opacity="0.15"/>
            <ellipse cx="450" cy="450" rx="370" ry="350" fill="none" stroke="#7c3aed" strokeWidth="12" opacity="0.6"/>
            <ellipse cx="450" cy="450" rx="358" ry="338" fill="none" stroke="#4c1d95" strokeWidth="3"/>

            {/* ── Main football pitch ── */}
            <rect x="195" y="235" width="510" height="430" rx="10" fill="url(#grass)" stroke="#ffffff" strokeWidth="3" filter="url(#shadow)"/>

            {/* Grass stripes */}
            {[...Array(7)].map((_,i) => (
              <rect key={i} x="195" y={235 + i * 62} width="510" height="31" fill="#245c24" opacity="0.4"/>
            ))}

            {/* Touchlines */}
            <rect x="195" y="235" width="510" height="430" rx="10" fill="none" stroke="#ffffff" strokeWidth="3"/>

            {/* Halfway line */}
            <line x1="195" y1="450" x2="705" y2="450" stroke="#fff" strokeWidth="2.5"/>

            {/* Centre circle */}
            <circle cx="450" cy="450" r="65" fill="none" stroke="#fff" strokeWidth="2.5"/>
            <circle cx="450" cy="450" r="4"  fill="#fff"/>

            {/* Left penalty area */}
            <rect x="195" y="339" width="100" height="222" fill="none" stroke="#fff" strokeWidth="2"/>
            {/* Left goal area */}
            <rect x="195" y="390" width="50"  height="120" fill="none" stroke="#fff" strokeWidth="2"/>
            {/* Left penalty spot */}
            <circle cx="250" cy="450" r="3.5" fill="#fff"/>
            {/* Left penalty arc */}
            <path d="M 295 380 A 65 65 0 0 1 295 520" fill="none" stroke="#fff" strokeWidth="2"/>

            {/* Right penalty area */}
            <rect x="605" y="339" width="100" height="222" fill="none" stroke="#fff" strokeWidth="2"/>
            {/* Right goal area */}
            <rect x="655" y="390" width="50"  height="120" fill="none" stroke="#fff" strokeWidth="2"/>
            {/* Right penalty spot */}
            <circle cx="650" cy="450" r="3.5" fill="#fff"/>
            {/* Right penalty arc */}
            <path d="M 605 380 A 65 65 0 0 0 605 520" fill="none" stroke="#fff" strokeWidth="2"/>

            {/* Corner arcs */}
            <path d="M 195 250 A 15 15 0 0 1 210 235" fill="none" stroke="#fff" strokeWidth="2"/>
            <path d="M 695 235 A 15 15 0 0 1 705 250" fill="none" stroke="#fff" strokeWidth="2"/>
            <path d="M 705 650 A 15 15 0 0 1 695 665" fill="none" stroke="#fff" strokeWidth="2"/>
            <path d="M 205 665 A 15 15 0 0 1 195 650" fill="none" stroke="#fff" strokeWidth="2"/>

            {/* Corner flags (dots) */}
            <circle cx="195" cy="235" r="5" fill="#ff4444" filter="url(#glow)"/>
            <circle cx="705" cy="235" r="5" fill="#ff4444" filter="url(#glow)"/>
            <circle cx="705" cy="665" r="5" fill="#ff4444" filter="url(#glow)"/>
            <circle cx="195" cy="665" r="5" fill="#ff4444" filter="url(#glow)"/>

            {/* Goal nets */}
            {/* Left goal */}
            <rect x="168" y="408" width="27" height="84" rx="2" fill="#ffffff18" stroke="#fff" strokeWidth="2"/>
            {[...Array(5)].map((_,i) => <line key={`lg${i}`} x1="168" y1={414+i*14} x2="195" y2={414+i*14} stroke="#fff" strokeWidth="0.8" opacity="0.5"/>)}
            {[168,179,190].map(x => <line key={`lgv${x}`} x1={x} y1="408" x2={x} y2="492" stroke="#fff" strokeWidth="0.8" opacity="0.5"/>)}
            {/* Right goal */}
            <rect x="705" y="408" width="27" height="84" rx="2" fill="#ffffff18" stroke="#fff" strokeWidth="2"/>
            {[...Array(5)].map((_,i) => <line key={`rg${i}`} x1="705" y1={414+i*14} x2="732" y2={414+i*14} stroke="#fff" strokeWidth="0.8" opacity="0.5"/>)}
            {[716,727,738].map(x => <line key={`rgv${x}`} x1={x} y1="408" x2={x} y2="492" stroke="#fff" strokeWidth="0.8" opacity="0.5"/>)}

            {/* ── Seating stands ── */}
            {/* North stand */}
            <path d="M 220 45 Q 450 20 680 45 L 660 195 Q 450 170 240 195 Z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" opacity="0.85"/>
            {/* South stand */}
            <path d="M 240 705 Q 450 730 660 705 L 680 855 Q 450 880 220 855 Z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" opacity="0.85"/>
            {/* East stand */}
            <path d="M 705 240 L 855 220 Q 880 450 855 680 L 705 660 Q 730 450 705 240 Z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" opacity="0.85"/>
            {/* West stand */}
            <path d="M 195 240 Q 170 450 195 660 L 45 680 Q 20 450 45 220 Z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" opacity="0.85"/>

            {/* Seating rows — North */}
            {[60,80,100,120,140,160,180].map(y => (
              <path key={`ns${y}`} d={`M ${240+(y-60)*0.25} ${y} Q 450 ${y-8} ${660-(y-60)*0.25} ${y}`}
                    fill="none" stroke="#3b82f655" strokeWidth="1.5"/>
            ))}
            {/* Seating rows — South */}
            {[720,740,760,780,800,820,840].map(y => (
              <path key={`ss${y}`} d={`M ${240+(840-y)*0.25} ${y} Q 450 ${y+8} ${660-(840-y)*0.25} ${y}`}
                    fill="none" stroke="#3b82f655" strokeWidth="1.5"/>
            ))}
            {/* Seating rows — East */}
            {[720,740,760,780,800,820,840].map((x,i) => (
              <path key={`es${i}`} d={`M ${x+100} ${240+(840-x)*0.25} Q ${x+108} 450 ${x+100} ${660-(840-x)*0.25}`}
                    fill="none" stroke="#3b82f655" strokeWidth="1.5"/>
            ))}
            {/* Seating rows — West */}
            {[60,80,100,120,140,160,180].map((x,i) => (
              <path key={`ws${i}`} d={`M ${x} ${240+(x-60)*0.25} Q ${x-8} 450 ${x} ${660-(x-60)*0.25}`}
                    fill="none" stroke="#3b82f655" strokeWidth="1.5"/>
            ))}

            {/* ── VIP / Press boxes ── */}
            <rect x="380" y="32" width="140" height="28" rx="6" fill="#f59e0b" opacity="0.9" stroke="#d97706" strokeWidth="1.5"/>
            <text x="450" y="50" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1c1917" fontFamily="sans-serif">VIP NORTH</text>

            <rect x="380" y="840" width="140" height="28" rx="6" fill="#f59e0b" opacity="0.9" stroke="#d97706" strokeWidth="1.5"/>
            <text x="450" y="858" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1c1917" fontFamily="sans-serif">VIP SOUTH</text>

            {/* Press box (east) */}
            <rect x="840" y="420" width="28" height="60" rx="6" fill="#8b5cf6" opacity="0.9" stroke="#7c3aed" strokeWidth="1.5"/>
            <text x="854" y="453" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff" fontFamily="sans-serif" transform="rotate(90, 854, 453)">PRESS</text>

            {/* ── Concourse ring ── */}
            <ellipse cx="450" cy="450" rx="415" ry="415" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="8 6" opacity="0.4"/>

            {/* Gate labels */}
            <text x="450" y="30"  textAnchor="middle" fontSize="11" fontWeight="bold" fill="#94a3b8" fontFamily="sans-serif">NORTH GATE</text>
            <text x="450" y="888" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#94a3b8" fontFamily="sans-serif">SOUTH GATE</text>
            <text x="882" y="455" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#94a3b8" fontFamily="sans-serif" transform="rotate(90, 882, 455)">EAST GATE</text>
            <text x="18"  y="455" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#94a3b8" fontFamily="sans-serif" transform="rotate(-90, 18, 455)">WEST GATE</text>

            {/* Scoreboard */}
            <rect x="345" y="37" width="210" height="55" rx="8" fill="#0f172a" stroke="#1e40af" strokeWidth="2" opacity="0.95"/>
            <rect x="350" y="42" width="95" height="45" rx="4" fill="#1e3a5f"/>
            <rect x="455" y="42" width="95" height="45" rx="4" fill="#1e3a5f"/>
            <text x="397" y="71" textAnchor="middle" fontSize="22" fontWeight="black" fill="#f1f5f9" fontFamily="monospace">2</text>
            <text x="502" y="71" textAnchor="middle" fontSize="22" fontWeight="black" fill="#f1f5f9" fontFamily="monospace">1</text>
            <text x="450" y="62" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ef4444" fontFamily="monospace">●</text>
          </svg>

          {/* ── Heatmap canvas overlay ── */}
          <HeatmapCanvas zones={venueData.zones} visible={showHeatmap} />

          {/* ── Zone density overlays (SVG) ── */}
          {showZoneLabels && (
            <svg viewBox="0 0 900 900" className="absolute inset-0 w-full h-full pointer-events-none">
              {venueData.zones?.filter(z => ZONE_PATHS[z.id]).map(zone => {
                const pct = (zone.current_occupancy / zone.capacity) * 100;
                const { fill, label } = densityToColor(pct);
                return (
                  <g key={zone.id}>
                    <path d={ZONE_PATHS[zone.id]} fill={fill} opacity="0.35"/>
                    <path d={ZONE_PATHS[zone.id]} fill="none" stroke={fill} strokeWidth="2" opacity="0.7"/>
                  </g>
                );
              })}
            </svg>
          )}

          {/* ── Zone % labels ── */}
          {showZoneLabels && venueData.zones?.filter(z => ZONE_PATHS[z.id]).map(zone => {
            const pct = (zone.current_occupancy / zone.capacity) * 100;
            const { fill } = densityToColor(pct);
            const centers = { Z1: {x:450,y:118}, Z2: {x:450,y:778}, Z3: {x:780,y:450}, Z4: {x:120,y:450} };
            const c = centers[zone.id];
            if (!c) return null;
            const metric = activeLayer === 'density' ? `${pct.toFixed(0)}%` : `${zone.current_occupancy.toLocaleString()} fans`;
            return (
              <div key={zone.id} className="absolute pointer-events-none z-20 text-center"
                   style={{ left: `${(c.x/900)*100}%`, top: `${(c.y/900)*100}%`, transform: 'translate(-50%,-50%)' }}>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/80 drop-shadow">{zone.name}</div>
                  <div className="text-sm font-black drop-shadow-lg" style={{ color: fill, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{metric}</div>
                </div>
              </div>
            );
          })}

          {/* ── Navigation arrow ── */}
          {navigationTarget && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 900 900">
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6"/>
                </marker>
              </defs>
              <path
                d={`M ${USER_POS.x} ${USER_POS.y} Q ${(USER_POS.x + navigationTarget.x) / 2} ${(USER_POS.y + navigationTarget.y) / 2 - 60} ${navigationTarget.x} ${navigationTarget.y}`}
                fill="none" stroke="#3b82f6" strokeWidth="5" strokeDasharray="14,9"
                markerEnd="url(#arrow)" className="animate-[navdash_1.5s_linear_infinite]"
              />
              <circle cx={navigationTarget.x} cy={navigationTarget.y} r="18" fill="#3b82f6" opacity="0.2" className="animate-ping"/>
            </svg>
          )}

          {/* ── User position ── */}
          <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-auto"
               style={{ top: `${(USER_POS.y/900)*100}%`, left: `${(USER_POS.x/900)*100}%` }}>
            <div className="relative flex items-center justify-center group cursor-pointer">
              <div className="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-50"/>
              <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg z-10 transition-transform group-hover:scale-125"/>
              <div className="absolute bottom-full mb-1.5 bg-gray-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-full whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                📍 Your Seat
              </div>
            </div>
          </div>

          {/* ── Facility markers ── */}
          <div className="absolute inset-0 pointer-events-auto">
            {venueData.gates?.map((f, i) => renderMarker(f, 'Gates', POSITIONS.Gates[i % 4]))}
            {venueData.concessions?.map((f, i) => renderMarker(f, 'Concessions', POSITIONS.Concessions[i % 4]))}
            {venueData.restrooms?.map((f, i) => renderMarker(f, 'Restrooms', POSITIONS.Restrooms[i % 4]))}
            {venueData.medical_posts?.map((f, i) => renderMarker(f, 'Medical', POSITIONS.Medical[i % 2]))}
            {venueData.parking?.map((f, i) => renderMarker(f, 'Parking', POSITIONS.Parking[i % 2]))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes navdash { to { stroke-dashoffset: -30; } }
        .popup-entry { animation: popIn 0.18s ease-out forwards; }
        @keyframes popIn { from { opacity:0; transform:translate(-50%,8px); } to { opacity:1; transform:translate(-50%,0); } }
      `}</style>
    </div>
  );
}
