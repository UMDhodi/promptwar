import React, { useState } from 'react';
import { validateSeatInput, sanitizeInput } from '../services/security';

/**
 * OnboardingModal — first-time setup screen capturing seat and accessibility preferences.
 * Validates input before persisting to localStorage.
 *
 * @param {Object} props
 * @param {Function} props.onComplete - Called with { seat, needsAccess } on form submit
 */
export default function OnboardingModal({ onComplete }) {
  const [seat, setSeat] = useState('');
  const [needsAccess, setNeedsAccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedSeat = sanitizeInput(seat);
    const validation = validateSeatInput(cleanedSeat);

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    const finalSeat = cleanedSeat.trim() || 'General Admission';
    localStorage.setItem('userSeat', finalSeat);
    localStorage.setItem('userNeedsAccess', JSON.stringify(needsAccess));
    onComplete({ seat: finalSeat, needsAccess });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/80 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description"
    >
      <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-2xl text-white shadow-inner"
            aria-hidden="true"
          >
            IQ
          </div>
        </div>

        <h2
          id="onboarding-title"
          className="text-2xl font-bold text-center text-gray-900 mb-1"
        >
          Welcome to Apex Arena!
        </h2>
        <p
          id="onboarding-description"
          className="text-sm text-center text-gray-500 mb-6"
        >
          Tell us your seat so we can give you personalized directions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="seat-input"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Enter your seat section:
            </label>
            <input
              id="seat-input"
              type="text"
              placeholder="e.g. Z2, 104, South Stand"
              className={`w-full bg-gray-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 border transition-all text-sm ${
                error ? 'border-red-400 focus:ring-red-400/50' : 'border-gray-200'
              }`}
              value={seat}
              onChange={(e) => { setSeat(e.target.value); setError(null); }}
              aria-describedby={error ? 'seat-error' : undefined}
              aria-invalid={!!error}
              maxLength={20}
              autoFocus
            />
            {error && (
              <p id="seat-error" role="alert" className="mt-1 text-xs text-red-600 font-medium">
                {error}
              </p>
            )}
          </div>

          <label className="flex items-start space-x-3 cursor-pointer group p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
            <div className="relative flex items-start pt-0.5">
              <input
                id="accessibility-checkbox"
                type="checkbox"
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                checked={needsAccess}
                onChange={(e) => setNeedsAccess(e.target.checked)}
                aria-label="I need accessible routes — filters to wheelchair-friendly facilities"
              />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-800">I need accessible routes</span>
              <p className="text-xs text-gray-500 mt-0.5">Filters facilities to wheelchair-friendly options</p>
            </div>
          </label>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Enter stadium and start navigation"
          >
            Enter Stadium
          </button>
        </form>
      </div>
    </div>
  );
}
