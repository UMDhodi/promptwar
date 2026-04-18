import React from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { Clock, Utensils, Droplet, ArrowRightCircle, Car, MapPin, HeartPulse } from 'lucide-react';

export default function WaitTimeDashboard({ isAccessibleFilter }) {
  const { venueData, loading } = useFirestore();

  if (loading || !venueData) return null;

  // Priority 7 Implementation mapping block
  const getBadgeContent = (title, item, idx) => {
      let isBest = false;
      let badgeHtml = null;

      // Extract raw metrics to determine Best
      if (title === 'RESTROOMS') {
         isBest = idx === 0 && item.wait_minutes < 15;
         return (
            <span className="text-[13px] font-bold text-gray-800">
              {item.id}({item.wait_minutes}m{isBest && ' BEST'})
            </span>
         );
      }

      if (title === "MEDICAL POSTS") {
         const suffix = item.is_24hr ? '24hr' : 'Staffed';
         return (
            <span className="text-[13px] font-bold text-gray-800">
               {item.id} "{item.name.replace('Main Medical', 'North')} - {suffix}"
            </span>
         );
      }

      if (title === "PARKING") {
         isBest = idx === 0;
         return (
            <span className="text-[13px] font-bold text-gray-800">
               {item.name} - {item.available} free {isBest && 'BEST'}
            </span>
         );
      }

      // Default for others
      const waitTime = item.wait_minutes || item.wait_minutes_to_exit || 0;
      isBest = idx === 0 && waitTime < 10 && title !== 'MEDICAL POSTS';
      let timeColor = "text-green-600 bg-green-50";
      if (waitTime > 5) timeColor = "text-yellow-600 bg-yellow-50";
      if (waitTime > 15) timeColor = "text-red-600 bg-red-50";

      return (
         <>
            <span className="text-[13px] font-bold text-gray-800 flex items-center">
              {item.name || item.id} 
              {isBest && <span className="ml-2 px-1.5 py-0.5 bg-green-500 text-white text-[9px] rounded-sm uppercase font-black tracking-widest shadow-sm">Best</span>}
            </span>
            <div className={`flex flex-col items-end absolute right-0 top-1/2 -translate-y-1/2`}>
                <div className={`flex items-center font-bold px-3 py-1.5 rounded-lg ${timeColor} shadow-sm border border-black/5`}>
                  <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                  {waitTime}m
                </div>
            </div>
         </>
      );
  }

  const renderFacilityList = (title, icon, items, waitExtractor) => {
    if (!items || items.length === 0) return null;

    let filtered = [...items];
    if (isAccessibleFilter && title === 'RESTROOMS') {
       filtered = filtered.filter(item => item.accessible !== false);
    }
    
    // Reverse sort Parking (most free spots is BEST, so descending)
    if (title === 'PARKING') {
       filtered.sort((a,b) => b.available - a.available);
    } else {
       filtered.sort((a,b) => waitExtractor(a) - waitExtractor(b));
    }
    
    // Explicit format request (Priority 7 requires overriding Medical names temporarily if needed)
    return (
      <div className="bg-white rounded-[1.5rem] shadow-sm p-5 mb-4 border border-gray-100 shrink-0">
        <h3 className="text-[11px] font-black flex items-center text-gray-800 mb-4 uppercase tracking-wider bg-gray-50 -mx-5 -mt-5 p-4 rounded-t-[1.5rem] border-b border-gray-100">
          {icon} <span className="ml-2 text-blue-900">{title}</span>
        </h3>
        <div className="space-y-4">
          {filtered.map((item, idx) => {
            return (
              <div key={item.id} className="flex justify-between items-center group relative border-b border-gray-50 pb-2 last:border-0 last:pb-0 min-h-[30px]">
                <div className="flex flex-col relative w-full">
                   {getBadgeContent(title, item, idx)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 bg-[#E5E9F0] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-24">
      <div className="flex items-center justify-between mb-4 px-1 shrink-0">
         <h2 className="text-lg font-black text-gray-900 tracking-tight">Live Directory</h2>
         <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
         </span>
      </div>
      
      {renderFacilityList("ENTRY/EXIT GATES", <ArrowRightCircle className="w-4 h-4 text-indigo-600"/>, venueData.gates, i => i.wait_minutes)}
      {renderFacilityList("CONCESSIONS", <Utensils className="w-4 h-4 text-orange-600"/>, venueData.concessions, i => i.wait_minutes)}
      {renderFacilityList("RESTROOMS", <Droplet className="w-4 h-4 text-blue-600"/>, venueData.restrooms, i => i.wait_minutes)}
      {renderFacilityList("MEDICAL POSTS", <HeartPulse className="w-4 h-4 text-red-600"/>, venueData.medical_posts, i => i.wait_minutes || 0)}
      {renderFacilityList("PARKING", <Car className="w-4 h-4 text-gray-800"/>, venueData.parking, i => i.wait_minutes_to_exit)}
    </div>
  );
}
