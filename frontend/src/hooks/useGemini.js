import { useState, useCallback } from 'react';
import { useFirestore } from './useFirestore';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function buildSystemPrompt(context) {
  return `You are StadiumIQ, a smart venue assistant at Apex Arena (60,000 seat cricket/football stadium).
You have access to live venue data in the user's context below.

User context: ${JSON.stringify(context, null, 2)}

Stadium layout:
- NORTH Stand: upper tier, Gates G1 (North), food at NFC
- SOUTH Stand: lower tier, user's section, Gates G2 (South), food at SK (South Kiosks), restrooms R2
- EAST Stand: premium, Gate G3, high density 92%  
- WEST Stand: family zone, Gate G4, food at WFZ
- Medical posts: M1 (North, 24hr), M2 (South, staffed)
- Parking: North Lot (340 free, BEST), South Lot (800 free)
- Restrooms: R1 North (8m wait), R2 South (2m, BEST), R3 East (15m), R4 West (3m)

Rules:
1. Give specific, actionable answers based on the user's seat section.
2. Always recommend the CLOSEST facility to their seat.
3. For restrooms → highlight R2 if user is in South/SOUTH zone.
4. For food → highlight C2 or SK (South Kiosks).
5. For exit → highlight G2 (South Gate, 3m wait).
6. For medical → highlight M2.
7. For parking → highlight P2 (South Lot).
8. Respond in 1-2 clear sentences. Never say "I don't know".
9. Always include a map_highlight ID from: G1,G2,G3,G4,C1,C2,C3,C4,R1,R2,R3,R4,M1,M2,P1,P2

IMPORTANT: Return ONLY valid JSON in this exact format, no markdown:
{"response":"answer here","suggested_actions":[{"label":"Label","query":"query"}],"map_highlight":"ID"}`;
}

async function callGeminiDirectly(message, context, history) {
  const systemPrompt = buildSystemPrompt(context);
  
  const formattedHistory = history
    .slice(-6) // Only last 6 messages to keep prompt short
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const fullPrompt = `${systemPrompt}\n\nConversation:\n${formattedHistory}\nuser: ${message}\nassistant:`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 300 }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Gemini ${response.status}: ${err?.error?.message}`);
  }

  const data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  return JSON.parse(text);
}

function parseIntentFallback(message, venueData) {
  const msg = message.toLowerCase();
  
  if (msg.includes('restroom') || msg.includes('toilet') || msg.includes('bathroom')) {
    return {
      response: "Nearest restroom: R2 (South) — only 2 min wait! It's right in your section. 🚻",
      suggested_actions: [{ label: "Find Food", query: "Where is the nearest food?" }],
      map_highlight: "R2"
    };
  }
  if (msg.includes('food') || msg.includes('eat') || msg.includes('hungry') || msg.includes('concession')) {
    return {
      response: "South Kiosks (nearest to your seat) have a 4 min wait — shortest in the stadium right now! 🍔",
      suggested_actions: [{ label: "Find Restrooms", query: "Where are the closest restrooms?" }],
      map_highlight: "C2"
    };
  }
  if (msg.includes('exit') || msg.includes('gate') || msg.includes('leave') || msg.includes('out')) {
    return {
      response: "South Gate (G2) is your fastest exit — 3 min wait. Head straight down from Section 104. 🚪",
      suggested_actions: [{ label: "Parking", query: "What is parking status?" }],
      map_highlight: "G2"
    };
  }
  if (msg.includes('parking') || msg.includes('car') || msg.includes('lot')) {
    return {
      response: "North Lot is BEST with 340 free spaces. South Lot has 800 spaces but longer exit queue. 🅿️",
      suggested_actions: [{ label: "Best Exit", query: "What is the fastest gate?" }],
      map_highlight: "P1"
    };
  }
  if (msg.includes('medical') || msg.includes('first aid') || msg.includes('help') || msg.includes('emergency')) {
    return {
      response: "M2 Medical Post (South) is 50m from your seat — staffed 24/7. For emergencies dial 999. ⛑️",
      suggested_actions: [{ label: "Best Exit", query: "What gate should I use?" }],
      map_highlight: "M2"
    };
  }
  if (msg.includes('crowd') || msg.includes('busy') || msg.includes('density')) {
    return {
      response: "East Stand is at 92% capacity (avoid!). Your South Stand is at 60% — comfortable. West is 55%. 📊",
      suggested_actions: [{ label: "Best Exit", query: "What gate should I use to avoid crowds?" }],
      map_highlight: null
    };
  }
  if (msg.includes('seat') || msg.includes('section') || msg.includes('where am i') || msg.includes('location')) {
    return {
      response: `You're in Section ${context?.seat || '104'}, South Stand — great view of the pitch with easy access to South Gate. 📍`,
      suggested_actions: [{ label: "Find Restrooms", query: "Where are restrooms near me?" }],
      map_highlight: "G2"
    };
  }
  
  // Generic helpful response
  return {
    response: "I'm here to help! I can guide you to restrooms, food, exits, parking, or medical posts. What do you need?",
    suggested_actions: [
      { label: "Find Restrooms", query: "Nearest restrooms?" },
      { label: "Nearest Food", query: "Nearest food?" },
      { label: "Best Exit", query: "Best exit gate?" }
    ],
    map_highlight: null
  };
}

const WELCOME_MSG = { role: 'assistant', content: "Hi! I'm StadiumIQ 👋 I can guide you to restrooms, food, exits, parking, or medical posts. What do you need?" };

export function useGemini() {
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState([
    { label: "Nearest Food", query: "Where is the nearest food concession?" },
    { label: "Find Restrooms", query: "Where are the closest restrooms?" },
    { label: "Best Exit", query: "What is the fastest gate to exit?" },
    { label: "Parking", query: "What's the parking status?" },
    { label: "Medical Help", query: "Where is the nearest medical post?" }
  ]);
  const [mapHighlight, setMapHighlight] = useState(null);
  const { venueData } = useFirestore();

  const sendMessage = useCallback(async (msg, userContext = {}) => {
    if (!msg.trim() || isLoading) return;

    const newMsg = { role: 'user', content: msg };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setMapHighlight(null);

    const enrichedContext = {
      seat: userContext.seat_number || '104',
      zone: 'SOUTH',
      accessibility: userContext.accessibility_needs || false,
      live_data: venueData ? {
        gates: venueData.gates?.map(g => ({ id: g.id, name: g.name, wait: g.wait_minutes })),
        concessions: venueData.concessions?.map(c => ({ id: c.id, name: c.name, wait: c.wait_minutes })),
        restrooms: venueData.restrooms?.map(r => ({ id: r.id, wait: r.wait_minutes })),
        zones: venueData.zones?.map(z => ({ id: z.id, name: z.name, density: Math.round((z.current_occupancy / z.capacity) * 100) }))
      } : {}
    };

    try {
      let parsed;
      
      if (GEMINI_API_KEY) {
        try {
          parsed = await callGeminiDirectly(msg, enrichedContext, messages);
        } catch (geminiErr) {
          console.warn('Gemini direct call failed, using fallback:', geminiErr.message);
          parsed = parseIntentFallback(msg, enrichedContext);
        }
      } else {
        parsed = parseIntentFallback(msg, enrichedContext);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: parsed.response }]);
      if (parsed.suggested_actions?.length) setSuggestedActions(parsed.suggested_actions);
      if (parsed.map_highlight) setMapHighlight(parsed.map_highlight);

    } catch (error) {
      console.error('useGemini error:', error);
      const fallback = parseIntentFallback(msg, enrichedContext);
      setMessages(prev => [...prev, { role: 'assistant', content: fallback.response }]);
      if (fallback.map_highlight) setMapHighlight(fallback.map_highlight);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, venueData]);

  return { messages, sendMessage, isLoading, suggestedActions, mapHighlight };
}
