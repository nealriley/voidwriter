/**
 * Main entry point of the application.
 * Sets up React and renders the App component to the DOM.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import fonts locally via fontsource for better performance
import '@fontsource/press-start-2p'  // Pixel arcade font
import '@fontsource/orbitron/700.css' // Vector arcade font for potential future use

// Create React root and render the application in StrictMode for better development experience
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)