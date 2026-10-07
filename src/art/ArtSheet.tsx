import { ART_KEYS, type ArtKey } from '../domain/types'
import { Art } from './Art'
import { FILL, INK, PAPER } from './palette'

const SMALL = 40
const DEFAULT_LARGE = 96

function readParams(): { keys: readonly ArtKey[]; large: number } {
  const params = new URLSearchParams(window.location.search)
  const only = params.get('only')
  const wanted = only ? new Set(only.split(',').map((key) => key.trim())) : null
  const keys = wanted ? ART_KEYS.filter((key) => wanted.has(key)) : ART_KEYS
  const size = Number(params.get('size'))
  const large = Number.isFinite(size) && size > 0 ? size : DEFAULT_LARGE
  return { keys, large }
}

/**
 * Dev-only page (open /?art) showing every drawing large and small.
 * Filter with ?art&only=tomato,carrot and enlarge with &size=200.
 */
export function ArtSheet() {
  const { keys, large } = readParams()
  return (
    <main
      style={{
        background: PAPER,
        color: INK,
        minHeight: '100vh',
        padding: 24,
        boxSizing: 'border-box',
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 13,
      }}
    >
      <h1 style={{ fontSize: 18, margin: '0 0 12px' }}>
        Art sheet: {keys.length} drawings at {large}px and {SMALL}px
      </h1>
      <ul style={{ display: 'flex', gap: 6, listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
        {Object.entries(FILL).map(([name, hex]) => (
          <li
            key={name}
            title={`${name} ${hex}`}
            style={{ width: 22, height: 22, background: hex, outline: `1px solid ${INK}` }}
          />
        ))}
      </ul>
      <ul
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${large + SMALL + 40}px, 1fr))`,
          gap: '20px 12px',
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {keys.map((key) => (
          <li key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <Art name={key} size={large} />
              <Art name={key} size={SMALL} />
            </div>
            <span style={{ marginTop: 4 }}>{key}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
