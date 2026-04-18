const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function chatWithAssistant(message, userContext = {}, history = []) {
  try {
    console.log("API URL:", API_BASE);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userContext, history }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    console.log("Response status:", res.status);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return await res.json();
    
  } catch (err) {
    console.warn("Backend REST Fetch Error:", err);
    console.warn("Falling back into offline intent parser for demo mode.");
    
    const msgLower = message.toLowerCase();
    
    if (msgLower.includes('restroom') || msgLower.includes('toilet') || msgLower.includes('bathroom')) {
        return {
           response: "I'm having trouble connecting right now. Based on live data: nearest restroom is R2 (South) — 2 min wait. 🚻",
           suggested_actions: [{label: "Nearest Food", query: "Where is the nearest food?"}],
           map_highlight: "R2"
        };
    }

    if (msgLower.includes('medical') || msgLower.includes('help')) {
        return {
           response: "I'm having trouble connecting right now. Based on static data: nearest medical post is M2 (South First Aid) — staffed. ⛑️",
           suggested_actions: [{label: "Best Exit", query: "What is the best way out?"}],
           map_highlight: "M2"
        };
    }

    if (msgLower.includes('parking') || msgLower.includes('lot') || msgLower.includes('car')) {
        return {
           response: "I'm offline right now. South Lot currently shows 800 free spots and a 5 min exit queue. 🅿️",
           suggested_actions: [{label: "Best Exit", query: "What is the best way out?"}],
           map_highlight: "P1"
        };
    }
    
    if (msgLower.includes('food') || msgLower.includes('eat') || msgLower.includes('concession') || msgLower.includes('hungry') || msgLower.includes('drink')) {
        return {
           response: "Lost connection to the backend. The closest food to South Stand is South Kiosks — 4 min wait. 🍔",
           suggested_actions: [{label: "Find Restrooms", query: "Where are the closest restrooms?"}],
           map_highlight: "C2"
        };
    }
    
    if (msgLower.includes('exit') || msgLower.includes('gate') || msgLower.includes('leave')) {
        return {
           response: "Offline context: South Gate is your best option with a 3 min queue. 🚪",
           suggested_actions: [{label: "Parking", query: "What is the parking status?"}],
           map_highlight: "G2"
        };
    }

    return {
       response: "I'm experiencing a connectivity delay. However, you can tap any of the locations on the map for precise static directions.",
       suggested_actions: [{label: "Find Restrooms", query: "Where are the closest restrooms?"}],
       map_highlight: null
    };
  }
}

export async function fetchVenueStatus() {
  const res = await fetch(`${API_BASE}/venue/status`);
  if (!res.ok) throw new Error('Failed to fetch venue status');
  return res.json();
}

export async function fetchRoute() {
  return {};
}
