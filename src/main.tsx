import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Mark the bootstrap successful only after React has painted content.
window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    if (document.querySelector('#root > *')) {
      (window as Window & { __nompongBooted?: boolean }).__nompongBooted = true
    }
  })
})

// PWA: installability + static caching (spec §12). Production only, so dev HMR is never cached.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined))
}
