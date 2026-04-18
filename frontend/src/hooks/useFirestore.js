import { useState, useEffect } from 'react';

const SEED_DATA = {
  name: "Apex Arena",
  total_capacity: 60000,
  center_lat: 28.6139,
  center_lng: 77.2090,
  gates: [
    {id: "G1", name: "North Gate", type: "main", wait_minutes: 7, lat: 28.6155, lng: 77.2090},
    {id: "G2", name: "South Gate", type: "main", wait_minutes: 3, lat: 28.6123, lng: 77.2090},
    {id: "G3", name: "East Gate", type: "premium", wait_minutes: 14, lat: 28.6139, lng: 77.2112},
    {id: "G4", name: "West Gate", type: "accessible", wait_minutes: 5, lat: 28.6139, lng: 77.2068}
  ],
  zones: [
    {id: "Z1", name: "North Stand", capacity: 15000, current_occupancy: 12000},
    {id: "Z2", name: "South Stand", capacity: 15000, current_occupancy: 8000},
    {id: "Z3", name: "East Premium", capacity: 10000, current_occupancy: 9500},
    {id: "Z4", name: "West Family", capacity: 10000, current_occupancy: 6000},
    {id: "Z5", name: "Concourse Level", capacity: 10000, current_occupancy: 4500}
  ],
  concessions: [
    {id: "C1", name: "North Food Court", zone: "Z1", wait_minutes: 12, lat: 28.6150, lng: 77.2085},
    {id: "C2", name: "South Kiosks", zone: "Z2", wait_minutes: 4, lat: 28.6128, lng: 77.2088},
    {id: "C3", name: "East Bar", zone: "Z3", wait_minutes: 18, lat: 28.6142, lng: 77.2108},
    {id: "C4", name: "West Family Zone", zone: "Z4", wait_minutes: 6, lat: 28.6136, lng: 77.2072}
  ],
  restrooms: [
    {id: "R1", zone: "Z1", wait_minutes: 8, accessible: true, lat: 28.6152, lng: 77.2092},
    {id: "R2", zone: "Z2", wait_minutes: 2, accessible: true, lat: 28.6125, lng: 77.2092},
    {id: "R3", zone: "Z3", wait_minutes: 15, accessible: false, lat: 28.6140, lng: 77.2110},
    {id: "R4", zone: "Z4", wait_minutes: 3, accessible: true, lat: 28.6138, lng: 77.2070}
  ],
  medical_posts: [
    {id: "M1", name: "Main Medical", lat: 28.6145, lng: 77.2080, is_24hr: true, wait_minutes: 1},
    {id: "M2", name: "South First Aid", lat: 28.6133, lng: 77.2098, is_24hr: false, wait_minutes: 2}
  ],
  parking: [
    {id: "P1", name: "North Lot", capacity: 2000, available: 340, wait_minutes_to_exit: 25, lat: 28.6170, lng: 77.2090},
    {id: "P2", name: "South Lot", capacity: 1500, available: 800, wait_minutes_to_exit: 5, lat: 28.6108, lng: 77.2090}
  ]
};

export function useFirestore() {
  const [venueData, setVenueData] = useState(SEED_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    setVenueData(JSON.parse(JSON.stringify(SEED_DATA)));
    setLoading(false);

    // Simulate real-time updates every 30s
    const interval = setInterval(() => {
      setVenueData(prevData => {
        const newData = { ...prevData };
        
        // Mutate Wait Times randomly between -2 and +3, never hitting 0
        const mutateArray = (arr) => arr.map(item => ({
          ...item,
          wait_minutes: item.wait_minutes !== undefined ? Math.max(1, item.wait_minutes + Math.floor(Math.random() * 6) - 2) : 1,
        }));

        // Mutate Occupancy randomly by +/- 5%
        const mutateZones = (arr) => arr.map(item => ({
            ...item,
            current_occupancy: Math.max(0, Math.min(item.capacity, item.current_occupancy + Math.floor((Math.random() * 0.1 - 0.05) * item.capacity)))
        }));

        // Mutate Parking
        const mutateParking = (arr) => arr.map(item => ({
          ...item,
          available: Math.max(0, item.available + Math.floor(Math.random() * 50) - 25),
          wait_minutes_to_exit: Math.max(1, item.wait_minutes_to_exit + Math.floor(Math.random() * 6) - 2)
        }));

        newData.concessions = mutateArray(newData.concessions);
        newData.restrooms = mutateArray(newData.restrooms);
        newData.gates = mutateArray(newData.gates);
        newData.zones = mutateZones(newData.zones);
        newData.parking = mutateParking(newData.parking);
        
        return newData;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return { venueData, loading };
}
