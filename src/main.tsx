import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import { App } from './app/App'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')
const root = createRoot(container)

// Dev-only component gallery at /?gallery. Tree-shaken out of production builds.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('gallery')) {
  const { Gallery } = await import('./ui/Gallery')
  root.render(
    <StrictMode>
      <Gallery />
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
