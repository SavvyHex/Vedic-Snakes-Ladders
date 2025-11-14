import React from 'react'
import { createRoot } from 'react-dom/client'
import PhaserGame from './components/PhaserGame'
import './index.css'

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <PhaserGame />
  </React.StrictMode>
)
