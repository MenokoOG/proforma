import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { StoreProvider } from './state/store'
import './styles/app.css'

const el = document.getElementById('root')
if (!el) throw new Error('Root element missing from index.html')

createRoot(el).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
