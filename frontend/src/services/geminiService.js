import { mockWaitTimes } from './firebaseConfig';
import { GoogleGenAI } from '@google/genai';

// Replace with your actual Gemini API key for production
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIza_MOCK_HACKATHON_KEY"; 

export const getGeminiResponse = async (userMessage, userContext) => {
  try {
    const systemInstruction = `
      You are StadiumSync AI, a smart assistant helping attendees at a sports stadium.
      User Current Seat: ${userContext.seat}
      User Ticket Tier: ${userContext.tier}
      
      Real-Time Wait Status:
      Restrooms: North (5 min), South (12 min)
      Food: Burger King Sector A (15 min), Burger King Sector B (4 min)
      Exits: Gate 1 (2 min), Gate 2 (18 min)
      
      Instructions:
      Based on the wait times and user context, give a short, logically helpful answer. Recommend the shortest wait path and warn against crowded areas. Be highly conversational, polite, and brief (max 2 sentences).
    `;

    // Attempt real API call if a valid key looks like it's present
    if (API_KEY && !API_KEY.includes("MOCK")) {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemInstruction}\n\nUser: ${userMessage}`
      });
      return response.text;
    } else {
      // Mocked AI logic for Hackathon Demonstration without API Key
      return getMockedResponse(userMessage, userContext);
    }
  } catch (error) {
    console.error("Gemini API Error: ", error);
    return "I'm having trouble connecting to the network right now. What else can I help you with?";
  }
};

const getMockedResponse = async (msg, context) => {
  const lowerMsg = msg.toLowerCase();
  await new Promise((r) => setTimeout(r, 1000)); // Simulate network latency

  if (lowerMsg.includes("bathroom") || lowerMsg.includes("restroom")) {
    return "I recommend using the North Restroom. The wait is only 5 minutes compared to 12 minutes at the South Restroom!";
  }
  if (lowerMsg.includes("food") || lowerMsg.includes("hungry") || lowerMsg.includes("burger")) {
    return `Burger King Sector B currently has the shortest wait (4 mins). Should I place a mobile order for quick pickup?`;
  }
  if (lowerMsg.includes("exit") || lowerMsg.includes("leave")) {
    return "To avoid the crowd, use Gate 1; it has only a 2-minute delay. Gate 2 is heavily congested right now.";
  }
  return `Hi! I'm your StadiumSync assistant. Your ticket is for ${context.seat}. How can I make your event experience better today?`;
};
