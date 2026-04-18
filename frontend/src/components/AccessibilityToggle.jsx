import React from 'react';

/**
 * Global accessibility toggle for filtering venue data
 * @param {boolean} isAccessible - current state
 * @param {function} onToggle - toggle function
 */
export default function AccessibilityToggle({ isAccessible, onToggle }) {
  return (
    <div className="flex items-center space-x-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/30 text-white shadow-sm cursor-pointer" onClick={onToggle} aria-label="Toggle accessibility features">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${isAccessible ? 'bg-green-400' : 'bg-gray-400'}`}>
        {isAccessible && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
      </div>
      <span className="text-sm font-medium">Accessible Routes</span>
    </div>
  );
}
