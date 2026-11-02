import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// o CSS global (tokens e reset) carrega antes de todo o resto
import './styles/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
