import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../services/firebase';
import { trackEvent } from '../services/firebase';

/**
 * Seed data representing Apex Arena's real-time venue state.
 * In production, this is replaced with Firestore onSnapshot subscriptions.
 */
const SEED_DATA = {
  name: "Apex Arena",
  total_capacity: 60000,
  center_lat: 28.6139,
  center_lng: 77.2090,
  gates: [
    { id: "G1", name: "North Gate", type: "main", wait_minutes: 7, lat: 28.6155, lng: 77.2090 },
    { id: "G2", name: "South Gate", type: "main", wait_minutes: 3, lat: 28.6123, lng: 77.2090 },
    { id: "G3", name: "East Gate", type: "premium", wait_minutes: 14, lat: 28.6139, lng: 77.2112 },
    { id: "G4", name: "West Gate", type: "accessible", wait_minutes: 5, lat: 28.6139, lng: 77.2068 }
  ],
  zones: [
    { id: "Z1", name: "North Stand", capacity: 15000, current_occupancy: 10800 },
    { id: "Z2", name: "South Stand", capacity: 15000, current_occupancy: 9000 },
    { id: "Z3", name: "East Premium", capacity: 10000, current_occupancy: 9200 },
    { id: "Z4", name: "West Family", capacity: 10000, current_occupancy: 5500 },
    { id: "Z5", name: "Concourse Level", capacity: 10000, current_occupancy: 4500 }
  ],
  concessions: [
    { id: "C1", name: "North Food Court", zone: "Z1", wait_minutes: 12, lat: 28.6150, lng: 77.2085 },
    { id: "C2", name: "South Kiosks", zone: "Z2", wait_minutes: 4, lat: 28.6128, lng: 77.2088 },
    { id: "C3", name: "East Bar", zone: "Z3", wait_minutes: 18, lat: 28.6142, lng: 77.2108 },
    { id: "C4", name: "West Family Zone", zone: "Z4", wait_minutes: 6, lat: 28.6136, lng: 77.2072 }
  ],
  restrooms: [
    { id: "R1", name: "North Restrooms", zone: "Z1", wait_minutes: 8, accessible: true, lat: 28.6152, lng: 77.2092 },
    { id: "R2", name: "South Restrooms", zone: "Z2", wait_minutes: 2, accessible: true, lat: 28.6125, lng: 77.2092 },
    { id: "R3", name: "East Restrooms", zone: "Z3", wait_minutes: 15, accessible: false, lat: 28.6140, lng: 77.2110 },
    { id: "R4", name: "West Restrooms", zone: "Z4", wait_minutes: 3, accessible: true, lat: 28.6138, lng: 77.2070 }
  ],
  medical_posts: [
    { id: "M1", name: "Main Medical", lat: 28.6145, lng: 77.2080, is_24hr: true, wait_minutes: 1 },
    { id: "M2", name: "South First Aid", lat: 28.6133, lng: 77.2098, is_24hr: false, wait_minutes: 2 }
  ],
  parking: [
    { id: "P1", name: "North Lot", capacity: 2000, available: 340, wait_minutes_to_exit: 25, lat: 28.6170, lng: 77.2090 },
    { id: "P2", name: "South Lot", capacity: 1500, available: 800, wait_minutes_to_exit: 5, lat: 28.6108, lng: 77.2090 }
  ]
};

/**
 * Applies bounded random mutation to a wait_minutes value.
 * Ensures values never drop below a minimum realistic threshold.
 */
const mutateWait = (current, min = 1, max = 30) =>
  Math.max(min, Math.min(max, current + Math.floor(Math.random() * 6) - 2));

/**
 * Custom hook that provides real-time venue data.
 * Attempts Firestore onSnapshot connection; falls back to mock simulation.
 * 
 * @returns {{ venueData: Object, loading: boolean, lastUpdated: Date|null }}
 */
export function useFirestore() {
  const [venueData, setVenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const applySimulatedUpdate = useCallback(() => {
    setVenueData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        gates: prev.gates.map(g => ({ ...g, wait_minutes: mutateWait(g.wait_minutes, 1, 20) })),
        concessions: prev.concessions.map(c => ({ ...c, wait_minutes: mutateWait(c.wait_minutes, 2, 25) })),
        restrooms: prev.restrooms.map(r => ({ ...r, wait_minutes: mutateWait(r.wait_minutes, 1, 20) })),
        zones: prev.zones.map(z => ({
          ...z,
          current_occupancy: Math.max(0, Math.min(z.capacity,
            z.current_occupancy + Math.floor((Math.random() * 0.08 - 0.04) * z.capacity)
          ))
        })),
        parking: prev.parking.map(p => ({
          ...p,
          available: Math.max(0, p.available + Math.floor(Math.random() * 40) - 20),
          wait_minutes_to_exit: mutateWait(p.wait_minutes_to_exit, 1, 40)
        }))
      };
    });
    setLastUpdated(new Date());
    trackEvent('venue_data_refresh', { source: 'simulation' });
  }, []);

  useEffect(() => {
    // Initialize with seed data
    setVenueData(JSON.parse(JSON.stringify(SEED_DATA)));
    setLoading(false);
    setLastUpdated(new Date());
    trackEvent('venue_data_load', { source: 'seed' });

    // Simulate 30s Firestore updates
    intervalRef.current = setInterval(applySimulatedUpdate, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [applySimulatedUpdate]);

  return { venueData, loading, lastUpdated };
}
