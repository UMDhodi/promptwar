import React, { useEffect, useState, useMemo } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { ZoomIn, ZoomOut, Maximize, Navigation } from 'lucide-react';

export default function VenueMap({ mapHighlight, isAccessibleFilter, isBlocked = false }) {
  const { venueData, loading } = useFirestore();

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [activePopup, setActivePopup] = useState(null); 
  const [navigationTarget, setNavigationTarget] = useState(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const resetMap = () => { setZoom(1); setOffset({x:0, y:0}); setActivePopup(null); setNavigationTarget(null); };

  const getWaitColor = (wait) => {
     if (typeof wait === 'string') return "bg-gray-100 text-gray-800 border-gray-300"; 
     if (wait > 15) return "bg-red-500 text-white border-white";
     if (wait > 5) return "bg-yellow-500 text-gray-900 border-white";
     return "bg-green-500 text-white border-white";
  };

  const getEmoji = (type) => {
    if(type === 'Gates') return '🚪';
    if(type === 'Concessions') return '🍔';
    if(type === 'Restrooms') return '🚻';
    if(type === 'Medical') return '⛑️';
    if(type === 'Parking') return '🅿️';
    return '📍';
  };

  const USER_POS = { x: 450, y: 810 }; 

  const positions = {
      Gates: [{x: 450, y: 72}, {x: 400, y: 820}, {x: 828, y: 450}, {x: 72, y: 450}], 
      Concessions: [{x: 360, y: 180}, {x: 450, y: 765}, {x: 720, y: 360}, {x: 180, y: 540}],
      Restrooms: [{x: 540, y: 180}, {x: 558, y: 810}, {x: 720, y: 540}, {x: 180, y: 360}], 
      Medical: [{x: 765, y: 135}, {x: 225, y: 774}],
      Parking: [{x: 765, y: 18}, {x: 135, y: 882}]
  };

  // Auto-highlight navigation interceptor
  useEffect(() => {
     if (!mapHighlight || !venueData) {
         setNavigationTarget(null);
         return;
     }
     
     // Find the corresponding facility by ID
     const categories = ['gates', 'concessions', 'restrooms', 'medical_posts', 'parking'];
     const mappedKeys = ['Gates', 'Concessions', 'Restrooms', 'Medical', 'Parking'];
     
     for (let i = 0; i < categories.length; i++) {
        const catArray = venueData[categories[i]];
        if (catArray) {
           const idx = catArray.findIndex(f => f.id === mapHighlight);
           if (idx !== -1) {
              const posArray = positions[mappedKeys[i]];
              if (posArray && posArray[idx % posArray.length]) {
                 setNavigationTarget({ id: mapHighlight, x: posArray[idx % posArray.length].x, y: posArray[idx % posArray.length].y });
                 return;
              }
           }
        }
     }
  }, [mapHighlight, venueData]);

  if (loading || !venueData) return <div className="p-4 text-center">Loading Map Canvas...</div>;

  const renderMarker = (facility, type, pos) => {
     if (isAccessibleFilter && type === 'Restrooms' && !facility.accessible) return null;

     const isHighlighted = mapHighlight === facility.id || navigationTarget?.id === facility.id;
     const isPopup = activePopup?.id === facility.id;
     
     let badgeText = '';
     let waitNum = 0;
     if (type === 'Parking') {
         badgeText = `${facility.available} free`;
     } else if (type === 'Medical') {
         badgeText = facility.is_24hr ? '24hr' : 'staffed';
     } else {
         waitNum = facility.wait_minutes_to_exit !== undefined ? facility.wait_minutes_to_exit : facility.wait_minutes || 0;
         badgeText = `${waitNum}m`;
     }

     return (
       <div 
         key={facility.id}
         className={`absolute cursor-pointer z-30 transition-all duration-300 ${isHighlighted ? 'scale-150 z-50' : 'hover:scale-125'}`}
         style={{ top: `${(pos.y/900)*100}%`, left: `${(pos.x/900)*100}%`, transform: 'translate(-50%, -50%)' }}
         onClick={() => {
              setActivePopup(isPopup ? null : { ...facility, x: pos.x, y: pos.y, badgeText, type });
         }}
       >
         {isHighlighted && <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-60 scale-150"></div>}

         <div className="relative text-2xl drop-shadow-md bg-white rounded-full p-1 shadow-sm border border-gray-100 flex items-center justify-center">
            {getEmoji(type)}
            <div className={`absolute -top-3 -right-2 ${getWaitColor(type === 'Parking' || type === 'Medical' ? badgeText : waitNum)} text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 shadow-sm z-40 whitespace-nowrap`}>
              {badgeText}
            </div>
         </div>

         {isPopup && (
           <div className="absolute left-1/2 -translate-x-1/2 bottom-[120%] mb-2 w-48 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-100 p-3 flex flex-col z-50 text-center font-sans tooltip-entry">
             <div className="font-black text-[13px] leading-tight text-gray-900 tracking-tight">{facility.name || `${type} ${facility.id}`}</div>
             <div className={`mt-0.5 text-[11px] font-bold ${waitNum > 15 ? 'text-red-600' : 'text-gray-500'}`}>
                Queue: {badgeText}
             </div>
             <button 
                onClick={(e) => { e.stopPropagation(); setNavigationTarget({id: facility.id, x: pos.x, y: pos.y}); setActivePopup(null); }}
                className="mt-2.5 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center"
             >
               <Navigation className="w-3 h-3 mr-1" /> Navigate
             </button>
             <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] border-4 border-transparent border-t-white"></div>
           </div>
         )}
       </div>
     );
  };

  return (
    <div className="relative w-full h-full bg-[#E5E9F0] overflow-hidden"
         onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
         
      {/* Zoom Controls — hidden while onboarding */}
      {!isBlocked && (
      <div className="absolute top-4 right-4 z-40 flex flex-col space-y-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border border-gray-200 shadow-sm">
        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" onClick={() => setZoom(z => Math.min(z + 0.25, 3))}><ZoomIn className="w-5 h-5"/></button>
        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}><ZoomOut className="w-5 h-5" /></button>
        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" onClick={resetMap}><Maximize className="w-5 h-5"/></button>
      </div>
      )}

      {/* Crowd Density Legend — hidden while onboarding */}
      {!isBlocked && (
      <div className="absolute bottom-4 left-4 bg-white/95 p-3 rounded-xl shadow-lg backdrop-blur-sm border border-gray-100 z-40 max-w-[200px]">
         <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">Crowd Density Layer</h4>
         <div className="flex flex-col space-y-2 text-xs font-semibold text-gray-700">
           <div className="flex items-center group"><div className="w-4 h-4 rounded-full bg-green-400 border border-green-500 mr-2 shadow-inner"></div> 0-60%</div>
           <div className="flex items-center group"><div className="w-4 h-4 rounded-full bg-yellow-400 border border-yellow-500 mr-2 shadow-inner"></div> 60-80%</div>
           <div className="flex items-center group"><div className="w-4 h-4 rounded-full bg-red-500 border border-red-600 mr-2 shadow-inner"></div> &gt;80%</div>
         </div>
      </div>
      )}

      <div className="absolute inset-0 transition-transform duration-75 origin-center"
           style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, cursor: isDragging ? 'grabbing' : 'grab' }}>
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none">

            {navigationTarget && (
               <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 900 900">
                 <path 
                   d={`M ${USER_POS.x} ${USER_POS.y} Q ${(USER_POS.x + navigationTarget.x)/2} ${(USER_POS.y + navigationTarget.y)/2 - 50} ${navigationTarget.x} ${navigationTarget.y}`} 
                   fill="none" 
                   stroke="#3b82f6" 
                   strokeWidth="8" 
                   strokeDasharray="15,10" 
                   className="animate-[dash_2s_linear_infinite]"
                 />
               </svg>
            )}

            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[340px] h-[540px] bg-green-500/80 rounded-[100px] border-[6px] border-white shadow-xl flex items-center justify-center z-10 overflow-hidden">
               <div className="w-full h-[3px] bg-white absolute top-1/2"></div>
               <div className="w-28 h-28 border-[3px] border-white rounded-full absolute top-1/2 transform -translate-y-1/2"></div>
            </div>

            {venueData.zones?.map((zone) => {
                 let posClass = "";
                 if(zone.id === 'Z1') posClass = "top-[5%] left-1/2 -translate-x-1/2 w-72 h-36 rounded-t-[160px]";
                 if(zone.id === 'Z2') posClass = "bottom-[5%] left-1/2 -translate-x-1/2 w-72 h-36 rounded-b-[160px]";
                 if(zone.id === 'Z3') posClass = "right-[5%] top-1/2 -translate-y-1/2 w-36 h-72 rounded-r-[160px]";
                 if(zone.id === 'Z4') posClass = "left-[5%] top-1/2 -translate-y-1/2 w-36 h-72 rounded-l-[160px]";
                 if(zone.id === 'Z5') return null;

                 let density = (zone.current_occupancy / zone.capacity) * 100;
                 let bgColor = "bg-green-400";
                 let overrideLabel = null;

                 if(zone.id === 'Z1') { 
                    bgColor = "bg-yellow-400"; 
                    overrideLabel = `NORTH\n${density.toFixed(0)}%`; 
                 } else if (zone.id === 'Z3') {
                    bgColor = "bg-red-500";
                    overrideLabel = `EAST\n${density.toFixed(0)}%`;
                 } else if (zone.id === 'Z4') {
                    overrideLabel = `WEST\n${density.toFixed(0)}%`;
                 } else if (zone.id === 'Z2') {
                    overrideLabel = `SOUTH\n${density.toFixed(0)}%`;
                 }

                 if (density > 80 && zone.id !== 'Z3') bgColor = "bg-red-500";
                 else if (density > 60 && zone.id !== 'Z1') bgColor = "bg-yellow-400";
                 
                 return (
                   <div key={zone.id} className={`absolute ${posClass} ${bgColor} flex flex-col items-center justify-center opacity-90 shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-colors duration-1000 border-2 border-white pointer-events-auto`}>
                      <div className="text-white text-[13px] font-bold text-center tracking-widest drop-shadow-md whitespace-pre-line leading-tight">
                         {overrideLabel}
                      </div>
                   </div>
                 );
            })}

            <div className="absolute inset-0 pointer-events-auto">
                 <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-auto" style={{ top: `${(USER_POS.y/900)*100}%`, left: `${(USER_POS.x/900)*100}%` }}>
                   <div className="relative flex items-center justify-center group cursor-pointer">
                      <div className="absolute w-7 h-7 bg-blue-500 rounded-full animate-ping opacity-60"></div>
                      <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md z-10 transition-transform group-hover:scale-125"></div>
                      <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-full whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">Your Seat</div>
                   </div>
                 </div>

                 {venueData.gates?.map((f, i) => renderMarker(f, 'Gates', positions.Gates[i%4]))}
                 {venueData.concessions?.map((f, i) => renderMarker(f, 'Concessions', positions.Concessions[i%4]))}
                 {venueData.restrooms?.map((f, i) => renderMarker(f, 'Restrooms', positions.Restrooms[i%4]))}
                 {venueData.medical_posts?.map((f, i) => renderMarker(f, 'Medical', positions.Medical[i%2]))}
                 {venueData.parking?.map((f, i) => renderMarker(f, 'Parking', positions.Parking[i%2]))}
            </div>
        </div>
      </div>
      <style>{`
        @keyframes dash { to { stroke-dashoffset: -30; } }
        .tooltip-entry { animation: fade-in-up 0.2s ease-out forwards; }
        @keyframes fade-in-up { from { opacity: 0; transform: translate(-50%, 5px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  )
}
