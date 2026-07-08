import { useState, useCallback, useRef } from 'react';
import { useFirestore } from './useFirestore';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Builds a concise system prompt grounded in real-time venue data.
 * @param {object} context - Enriched user + venue context object
 * @returns {string}
 */
function buildSystemPrompt(context) {
  return `You are FIFAiq, a smart football venue assistant at Apex Football Stadium (60,000-seat stadium).
You have access to live venue data in the user's context below.

User context: ${JSON.stringify(context, null, 2)}

Stadium layout:
- NORTH Stand: upper tier, Gates G1 (North), food at NFC (North Food Court)
- SOUTH Stand: lower tier, user's section, Gates G2 (South), food at SK (South Kiosks), restrooms R2
- EAST Stand: premium VIP, Gate G3, currently high crowd density 92%
- WEST Stand: family zone, Gate G4, food at WFZ (West Family Zone)
- Medical posts: M1 (North concourse, 24hr), M2 (South concourse, staffed)
- Parking: North Lot P1 (340 free), South Lot P2 (800 free, BEST)
- Restrooms: R1 North (8m wait), R2 South (2m, BEST), R3 East (15m), R4 West (3m)
- Football match is ongoing — 2nd Half in progress

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

/**
 * Calls the Gemini REST API directly with the current conversation history.
 * Supports request cancellation via AbortSignal.
 *
 * @param {string} message - The user's latest message
 * @param {object} context - Enriched venue context
 * @param {Array<{role:string, content:string}>} history - Full conversation so far
 * @param {AbortSignal} signal - AbortController signal for cancellation
 * @returns {Promise<{response:string, suggested_actions:Array, map_highlight:string|null}>}
 */
async function callGeminiDirectly(message, context, history, signal) {
  const systemPrompt = buildSystemPrompt(context);

  // Use the last 6 turns only to keep the prompt short
  const formattedHistory = history
    .slice(-6)
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const fullPrompt = `${systemPrompt}\n\nConversation:\n${formattedHistory}\nuser: ${message}\nassistant:`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal, // ← cancellation support
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Gemini ${response.status}: ${err?.error?.message ?? 'unknown error'}`);
  }

  const data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  // Strip any accidental markdown code fences before parsing
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();

  return JSON.parse(text);
}

/**
 * Keyword-based offline fallback for when Gemini is unavailable.
 * @param {string} message
 * @param {object} context
 * @returns {{ response:string, suggested_actions:Array, map_highlight:string|null }}
 */
function parseIntentFallback(message, context) {
  const msg = message.toLowerCase();

  if (msg.includes('restroom') || msg.includes('toilet') || msg.includes('bathroom')) {
    return {
      response: 'Nearest restroom: R2 (South) — only 2 min wait! It\'s right in your section. 🚻',
      suggested_actions: [{ label: 'Find Food', query: 'Where is the nearest food?' }],
      map_highlight: 'R2',
    };
  }
  if (msg.includes('food') || msg.includes('eat') || msg.includes('hungry') || msg.includes('concession')) {
    return {
      response: 'South Kiosks (nearest to your seat) have a 4 min wait — shortest in the stadium right now! 🍔',
      suggested_actions: [{ label: 'Find Restrooms', query: 'Where are the closest restrooms?' }],
      map_highlight: 'C2',
    };
  }
  if (msg.includes('exit') || msg.includes('gate') || msg.includes('leave') || msg.includes('out')) {
    return {
      response: 'South Gate (G2) is your fastest exit — 3 min wait. Head straight down from Section 104. 🚪',
      suggested_actions: [{ label: 'Parking', query: 'What is parking status?' }],
      map_highlight: 'G2',
    };
  }
  if (msg.includes('parking') || msg.includes('car') || msg.includes('lot')) {
    return {
      response: 'South Lot P2 has 800 free spaces and a shorter exit queue. 🅿️',
      suggested_actions: [{ label: 'Best Exit', query: 'What is the fastest gate?' }],
      map_highlight: 'P2',
    };
  }
  if (msg.includes('medical') || msg.includes('first aid') || msg.includes('help') || msg.includes('emergency')) {
    return {
      response: 'M2 Medical Post (South) is 50m from your seat — staffed 24/7. For emergencies dial 999. ⛑️',
      suggested_actions: [{ label: 'Best Exit', query: 'What gate should I use?' }],
      map_highlight: 'M2',
    };
  }
  if (msg.includes('crowd') || msg.includes('busy') || msg.includes('density')) {
    return {
      response: 'East Stand is at 92% capacity (avoid!). Your South Stand is at 60% — comfortable. West is 55%. 📊',
      suggested_actions: [{ label: 'Best Exit', query: 'What gate should I use to avoid crowds?' }],
      map_highlight: null,
    };
  }
  if (msg.includes('seat') || msg.includes('section') || msg.includes('where am i') || msg.includes('location')) {
    return {
      response: `You're in Section ${context?.seat ?? '104'}, South Stand — great view of the pitch with easy access to South Gate. 📍`,
      suggested_actions: [{ label: 'Find Restrooms', query: 'Where are restrooms near me?' }],
      map_highlight: 'G2',
    };
  }

  return {
    response: "I'm here to help! I can guide you to restrooms, food, exits, parking, or medical posts. What do you need?",
    suggested_actions: [
      { label: 'Find Restrooms', query: 'Nearest restrooms?' },
      { label: 'Nearest Food',   query: 'Nearest food?' },
      { label: 'Best Exit',      query: 'Best exit gate?' },
    ],
    map_highlight: null,
  };
}

/** Initial welcome message shown before the user types anything */
const WELCOME_MSG = {
  role: 'assistant',
  content: "Hi! I'm FIFAiq ⚽ I can guide you to restrooms, food, exits, parking, or medical posts. What do you need?",
};

/**
 * Custom hook managing the FIFAiq AI conversation.
 *
 * Key improvements over the original:
 * - Uses `messagesRef` to give `sendMessage` always-fresh history without
 *   stale closure issues (the original `messages` state was captured at
 *   creation time, so Gemini never saw previous turns).
 * - Each `sendMessage` call creates a new AbortController and cancels any
 *   in-flight request, preventing race conditions when the user sends
 *   multiple messages quickly.
 *
 * @returns {{ messages, sendMessage, isLoading, suggestedActions, mapHighlight }}
 */
export function useGemini() {
  const [messages, setMessages]               = useState([WELCOME_MSG]);
  const [isLoading, setIsLoading]             = useState(false);
  const [suggestedActions, setSuggestedActions] = useState([
    { label: 'Nearest Food',  query: 'Where is the nearest food concession?' },
    { label: 'Find Restrooms',query: 'Where are the closest restrooms?' },
    { label: 'Best Exit',     query: 'What is the fastest gate to exit?' },
    { label: 'Parking',       query: "What's the parking status?" },
    { label: 'Medical Help',  query: 'Where is the nearest medical post?' },
  ]);
  const [mapHighlight, setMapHighlight] = useState(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  /**
   * messagesRef always holds the latest messages array.
   * This lets sendMessage read fresh history without being listed as a dep
   * that would force a new callback on every message (and re-render chips).
   */
  const messagesRef = useRef([WELCOME_MSG]);

  /** Cancel the previous in-flight Gemini fetch when a new one starts. */
  const abortRef = useRef(/** @type {AbortController|null} */(null));

  const { venueData } = useFirestore();

  const sendMessage = useCallback(async (msg, userContext = {}) => {
    if (!msg.trim() || isLoading) return;

    // ── Cancel any previous in-flight request ──────────────────────────────
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // ── Append user message ───────────────────────────────────────────────
    const newMsg = { role: 'user', content: msg };
    const updatedMessages = [...messagesRef.current, newMsg];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    setIsLoading(true);
    setMapHighlight(null);

    // ── Build enriched context with live venue data ────────────────────────
    const enrichedContext = {
      seat:          userContext.seat_number ?? '104',
      zone:          'SOUTH',
      accessibility: userContext.accessibility_needs ?? false,
      live_data: venueData ? {
        gates:      venueData.gates?.map(g => ({ id: g.id, name: g.name, wait: g.wait_minutes })),
        concessions:venueData.concessions?.map(c => ({ id: c.id, name: c.name, wait: c.wait_minutes })),
        restrooms:  venueData.restrooms?.map(r => ({ id: r.id, wait: r.wait_minutes })),
        zones:      venueData.zones?.map(z => ({
          id: z.id,
          name: z.name,
          density: Math.round((z.current_occupancy / z.capacity) * 100),
        })),
      } : {},
    };

    try {
      let parsed;

      if (GEMINI_API_KEY) {
        try {
          // Pass messagesRef.current (always fresh) — fixes the stale closure bug
          parsed = await callGeminiDirectly(msg, enrichedContext, messagesRef.current, controller.signal);
        } catch (geminiErr) {
          if (geminiErr.name === 'AbortError') return; // Request was cancelled — do nothing
          console.warn('[useGemini] Gemini call failed, using fallback:', geminiErr.message);
          parsed = parseIntentFallback(msg, enrichedContext);
        }
      } else {
        parsed = parseIntentFallback(msg, enrichedContext);
      }

      const assistantMsg = { role: 'assistant', content: parsed.response };
      messagesRef.current = [...messagesRef.current, assistantMsg];
      setMessages(prev => [...prev, assistantMsg]);

      if (parsed.suggested_actions?.length) setSuggestedActions(parsed.suggested_actions);
      if (parsed.map_highlight)              setMapHighlight(parsed.map_highlight);

    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('[useGemini] Unexpected error:', error);
      const fallback = parseIntentFallback(msg, enrichedContext);
      const fallbackMsg = { role: 'assistant', content: fallback.response };
      messagesRef.current = [...messagesRef.current, fallbackMsg];
      setMessages(prev => [...prev, fallbackMsg]);
      if (fallback.map_highlight) setMapHighlight(fallback.map_highlight);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, venueData]); // messagesRef intentionally omitted — always current via ref

  return { messages, sendMessage, isLoading, suggestedActions, mapHighlight };
}
