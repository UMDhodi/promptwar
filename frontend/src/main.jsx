import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { signInFrictionless } from './services/firebase'

// Initialize app securely and statelessly for the user
signInFrictionless().then((user) => {
  if (user) console.log("Arena Guest session started");
}).catch(console.error);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
