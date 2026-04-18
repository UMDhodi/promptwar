import { createContext } from 'react';

// Stub for Firebase Config since this is for a hackathon.
// In a real scenario, this would initialize the firebase app and export firestore.

const firebaseConfig = {
  apiKey: "AIzaSy_YOUR_API_KEY_HERE",
  authDomain: "stadiumsync-ai.firebaseapp.com",
  projectId: "stadiumsync-ai",
  storageBucket: "stadiumsync-ai.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// We will mock real-time wait times for the hackathon preview
export const mockWaitTimes = {
  "Restroom North": 5, // mins
  "Restroom South": 12,
  "Burger King A": 15,
  "Burger King B": 4, 
  "Exit Gate 1": 2,
  "Exit Gate 2": 18
};

// Update function to simulate real-time crowd dynamics
export const getWaitTimes = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockWaitTimes);
        }, 500);
    });
};
