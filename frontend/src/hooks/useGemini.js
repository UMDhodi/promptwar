import { useState, useCallback } from 'react';
import { chatWithAssistant } from '../services/api';
import { useFirestore } from './useFirestore';

export function useGemini() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi there! I am StadiumIQ. How can I help you navigate Apex Arena today?' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState([
    { label: "Nearest Food", query: "Where is the nearest food concession with the shortest wait?" },
    { label: "Find Restrooms", query: "Where are the closest restrooms?" },
  ]);
  const [mapHighlight, setMapHighlight] = useState(null);
  
  // Need to pull live data to inject into Context
  const { venueData } = useFirestore();

  const sendMessage = useCallback(async (msg, userContext = {}) => {
    if (!msg.trim()) return;

    const newMsg = { role: 'user', content: msg };
    const currentMessages = [...messages, newMsg];
    setMessages(currentMessages);
    setIsLoading(true);
    setMapHighlight(null);

    try {
      // Re-hydrate context dynamically with live venue data
      const enrichedContext = {
          seat: userContext.seat_number,
          zone: "SOUTH", // Hardcoded mock reference zone if missing
          accessibility: userContext.accessibility_needs,
          live_data: venueData ? {
              gates: venueData.gates,
              concessions: venueData.concessions,
              restrooms: venueData.restrooms
          } : {}
      };

      const response = await chatWithAssistant(msg, enrichedContext, currentMessages.slice(0, -1));
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
      if (response.suggested_actions) setSuggestedActions(response.suggested_actions);
      if (response.map_highlight) setMapHighlight(response.map_highlight);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection temporarily unavailable. Please refer to the map or try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, venueData]);

  return { messages, sendMessage, isLoading, suggestedActions, mapHighlight };
}
