import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AudioGateProvider } from './contexts/AudioGateContext'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <AudioGateProvider>
    <App />
  </AudioGateProvider>
)
