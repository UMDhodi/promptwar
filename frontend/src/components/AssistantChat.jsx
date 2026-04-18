import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { getGeminiResponse } from '../services/geminiService';

const AssistantChat = ({ userContext }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: `Hello! I'm StadiumSync AI. I see you're seated in ${userContext.seat}. How can I assist you?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    const userMsg = text || input;
    if (!userMsg.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    const aiRes = await getGeminiResponse(userMsg, userContext);
    
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'ai', content: aiRes }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="glass-panel chat-assistant">
      <div className="chat-header">
        <div className="chat-avatar">
          <Bot color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem' }}>StadiumSync Gemini</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--success)' }}>● Active</p>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role === 'ai' ? 'msg-ai' : 'msg-user'}`}>
            {msg.content}
          </div>
        ))}
        {isTyping && (
          <div className="message msg-ai typing-indicator">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="suggestions">
        <button onClick={() => handleSend("Where is the closest restroom?")} className="suggestion-btn">
          📍 Nearest Restroom
        </button>
        <button onClick={() => handleSend("Order food")} className="suggestion-btn">
          🍔 Order Food
        </button>
        <button onClick={() => handleSend("Best exit route?")} className="suggestion-btn">
          🚪 Exit Route
        </button>
      </div>

      <div className="chat-input-area">
        <input 
          type="text" 
          placeholder="Ask me anything about the event..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isTyping}
        />
        <button onClick={() => handleSend()} disabled={isTyping || !input.trim()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AssistantChat;
