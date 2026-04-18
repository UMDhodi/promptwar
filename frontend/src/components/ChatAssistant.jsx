import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGemini } from '../hooks/useGemini';
import { Send, Bot, Loader2 } from 'lucide-react';
import { sanitizeInput, checkRateLimit } from '../services/security';

/**
 * ChatAssistant — conversational AI interface for StadiumIQ.
 * Handles user input, rate limiting, message display, and quick-action chips.
 *
 * @param {Object} props
 * @param {Object} props.userContext - Seat and accessibility preferences from onboarding
 * @param {Function} props.onMapHighlight - Callback to highlight a facility on the map
 */
export default function ChatAssistant({ userContext, onMapHighlight }) {
  const { messages, sendMessage, isLoading, suggestedActions, mapHighlight } = useGemini();
  const [inputMessage, setInputMessage] = useState('');
  const [rateLimitWarning, setRateLimitWarning] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (mapHighlight && onMapHighlight) {
      onMapHighlight(mapHighlight);
      const t = setTimeout(() => onMapHighlight(null), 8000);
      return () => clearTimeout(t);
    }
  }, [mapHighlight, onMapHighlight]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const cleaned = sanitizeInput(inputMessage);
    if (!cleaned) return;

    if (!checkRateLimit('chat', 15, 60000)) {
      setRateLimitWarning(true);
      setTimeout(() => setRateLimitWarning(false), 4000);
      return;
    }

    sendMessage(cleaned, userContext);
    setInputMessage('');
  }, [inputMessage, userContext, sendMessage]);

  const handleChipClick = useCallback((query) => {
    if (!checkRateLimit('chat', 15, 60000)) return;
    sendMessage(query, userContext);
  }, [userContext, sendMessage]);

  /** Handle Enter key in textarea without Shift for submit */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const chips = suggestedActions?.length > 0 ? suggestedActions : [
    { label: '🍔 Nearest Food', query: 'Where is the nearest food concession with the shortest wait?' },
    { label: '🚻 Find Restrooms', query: 'Where are the closest restrooms?' },
    { label: '🚪 Best Exit', query: 'What is the fastest gate to exit from my seat?' },
    { label: '🅿️ Parking', query: "What's the wait time for parking exits?" },
    { label: '⛑️ Medical Help', query: 'Where is the nearest medical post?' }
  ];

  return (
    <section
      className="flex flex-col h-full bg-white md:rounded-l-2xl shadow-[-10px_0_20px_rgba(0,0,0,0.03)] overflow-hidden z-20"
      aria-label="Stadium Assistant Chat"
      role="complementary"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 shrink-0 shadow-sm z-10 hidden md:block">
        <h2 className="text-lg font-black text-white flex items-center">
          <Bot className="w-5 h-5 mr-2 opacity-90" aria-hidden="true" />
          Stadium Assistant
        </h2>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc] scroll-smooth"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[90%] p-3.5 shadow-sm text-[13px] leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-[20px] rounded-br-[4px]'
                    : 'bg-white text-gray-800 rounded-[20px] rounded-bl-[4px] border border-gray-100'
                }`}
                role={isUser ? undefined : 'status'}
                aria-label={isUser ? `You said: ${msg.content}` : `Assistant: ${msg.content}`}
              >
                {!isUser && (
                  <div className="flex items-center text-blue-600 font-black mb-1 text-[10px] uppercase tracking-wider">
                    <Bot className="w-3 h-3 mr-1" aria-hidden="true" />
                    Stadium IQ
                  </div>
                )}
                {msg.content}
              </div>
              {idx > 0 && (
                <time className="text-[9px] text-gray-400 mt-1 font-medium px-1" dateTime={new Date().toISOString()}>
                  {timestamp}
                </time>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start" aria-live="assertive" aria-label="Assistant is thinking">
            <div className="bg-white p-3.5 rounded-[20px] rounded-bl-[4px] shadow-sm border border-gray-100 text-gray-400 flex items-center text-[13px]">
              <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
              Routing...
            </div>
          </div>
        )}

        {rateLimitWarning && (
          <div role="alert" className="text-center text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-2">
            Slow down! Max 15 messages per minute. 🛑
          </div>
        )}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Quick Chips + Input */}
      <div className="p-3 bg-white shrink-0 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        {/* Quick action chips */}
        <div
          className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide"
          role="group"
          aria-label="Quick navigation actions"
        >
          {chips.slice(0, 5).map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(action.query)}
              className="whitespace-nowrap px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-full text-[11px] font-bold transition-colors border border-blue-100 shadow-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label={`Quick action: ${action.label}`}
              disabled={isLoading}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          className="flex relative items-center mt-1"
          aria-label="Send a message to Stadium Assistant"
        >
          <label htmlFor="chat-input" className="sr-only">
            Ask something about Apex Arena
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            className="flex-1 w-full bg-gray-50 rounded-2xl pl-4 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/50 border border-gray-200 focus:bg-white transition-all text-[13px]"
            type="text"
            placeholder="Ask anything about Apex Arena..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
            aria-label="Chat message input"
            autoComplete="off"
            spellCheck="true"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="absolute right-1.5 w-[34px] h-[34px] flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-[14px] transition-colors shadow-sm disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5 ml-0.5" aria-hidden="true" />
          </button>
        </form>

        <p className="text-[9px] text-gray-400 text-right mt-1 pr-1">
          {inputMessage.length}/500
        </p>
      </div>
    </section>
  );
}
