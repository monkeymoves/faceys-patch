import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import { App } from './app/App'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')
const root = createRoot(container)

// Dev-only review pages: /?gallery (UI components) and /?art (drawings).
// Both are dropped from production builds.
const devPage = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null
if (devPage?.has('gallery')) {
  const { Gallery } = await import('./ui/Gallery')
  root.render(
    <StrictMode>
      <Gallery />
    </StrictMode>,
  )
} else if (devPage?.has('art')) {
  const { ArtSheet } = await import('./art/ArtSheet')
  root.render(
    <StrictMode>
      <ArtSheet />
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
