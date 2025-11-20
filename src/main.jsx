import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx' // CHANGE THIS from PhaserGame to App
import './index.css'

const root = createRoot(document.getElementById('root'))
root.render(
  // React StrictMode causes double-rendering in dev, which is fine but can make physics jittery. 
  // You can remove <React.StrictMode> tags if physics feel weird.
  <App />
)