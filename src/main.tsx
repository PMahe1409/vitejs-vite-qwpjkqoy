import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './GoalAPP.jsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
