// Stub for Firebase Config since this is for a hackathon.
// In a real scenario, this would initialize the firebase app and export firestore.

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
