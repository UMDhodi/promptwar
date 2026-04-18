import React, { useState, useRef, useEffect } from 'react';
import { useGemini } from '../hooks/useGemini';
import { Send, Bot, Loader2 } from 'lucide-react';

export default function ChatAssistant({ userContext, onMapHighlight }) {
  const { messages, sendMessage, isLoading, suggestedActions, mapHighlight } = useGemini();
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (mapHighlight && onMapHighlight) {
       onMapHighlight(mapHighlight);
       const t = setTimeout(() => onMapHighlight(null), 8000);
       return () => clearTimeout(t);
    }
  }, [mapHighlight, onMapHighlight]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage, userContext);
    setInputMessage("");
  };

  const handleChipClick = (query) => {
    sendMessage(query, userContext);
  };

  // Priority 6 constraints
  const chips = [
    { label: "Nearest Food", query: "Where is the nearest food concession?" },
    { label: "Find Restrooms", query: "Where are the closest restrooms?" },
    { label: "Best Exit", query: "What is the fastest gate to exit from my seat?" },
    { label: "Parking", query: "What's the wait time for parking exits?" },
    { label: "Medical Help", query: "Where is the nearest medical post?" }
  ];

  const renderChips = () => {
     let c = suggestedActions?.length > 0 ? suggestedActions : chips;
     return c.slice(0, 5).map((action, idx) => (
       <button 
         key={idx} 
         onClick={() => handleChipClick(action.query)}
         className="whitespace-nowrap px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-full text-[11px] font-bold transition-colors border border-blue-100 shadow-sm shrink-0"
       >
         {action.label}
       </button>
     ));
  }

  return (
    <div className="flex flex-col h-full bg-white md:rounded-l-2xl shadow-[-10px_0_20px_rgba(0,0,0,0.03)] overflow-hidden z-20">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 shrink-0 shadow-sm z-10 hidden md:block">
        <h2 className="text-lg font-black text-white flex items-center">
          <Bot className="w-5 h-5 mr-2 opacity-90" />
          Stadium Assistant
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc] scroll-smooth">
        {messages.map((msg, idx) => {
          const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          return (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[90%] p-3.5 shadow-sm text-[13px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-[20px] rounded-br-[4px]' : 'bg-white text-gray-800 rounded-[20px] rounded-bl-[4px] border border-gray-100'}`}>
                {msg.role === 'assistant' && <div className="flex items-center text-blue-600 font-black mb-1 text-[10px] uppercase tracking-wider"><Bot className="w-3 h-3 mr-1" /> Stadium IQ</div>}
                {msg.content}
              </div>
              {idx > 0 && <span className="text-[9px] text-gray-400 mt-1 font-medium px-1">{timestamp}</span>}
            </div>
          )
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3.5 rounded-[20px] rounded-bl-[4px] shadow-sm border border-gray-100 text-gray-400 flex items-center text-[13px]">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Routing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white shrink-0 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] xl:max-w-md">
         <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide">
           {renderChips()}
         </div>
        <form onSubmit={handleSubmit} className="flex relative items-center mt-1">
          <input
            className="flex-1 w-full bg-gray-50 rounded-2xl pl-4 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/50 border border-gray-200 focus:bg-white transition-all text-[13px]"
            type="text"
            placeholder="Ask anything about Apex Arena..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!inputMessage.trim() || isLoading}
            className="absolute right-1.5 w-[34px] h-[34px] flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-[14px] transition-colors shadow-sm disabled:shadow-none"
          >
            <Send className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
