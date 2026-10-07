import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ART_KEYS } from '../domain/types'
import { Art } from './Art'

describe('Art', () => {
  it.each(ART_KEYS)('draws %s as a 64x64 svg with real content', (key) => {
    const { container } = render(<Art name={key} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('viewBox', '0 0 64 64')
    const paths = svg?.querySelectorAll('path') ?? []
    expect(paths.length).toBeGreaterThan(1)
    for (const path of paths) {
      expect(path.getAttribute('d')?.trim()).toBeTruthy()
    }
  })

  it('is decorative by default, hidden from assistive tech', () => {
    const { container } = render(<Art name="tomato" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('role')
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('is an image with an accessible name when given a title', () => {
    render(<Art name="carrot" title="Carrots" />)
    const img = screen.getByRole('img', { name: 'Carrots' })
    expect(img).not.toHaveAttribute('aria-hidden')
  })

  it('defaults to 64px and takes a size', () => {
    const { container, rerender } = render(<Art name="pea" />)
    const svg = () => container.querySelector('svg')
    expect(svg()).toHaveAttribute('width', '64')
    expect(svg()).toHaveAttribute('height', '64')
    rerender(<Art name="pea" size={40} />)
    expect(svg()).toHaveAttribute('width', '40')
    expect(svg()).toHaveAttribute('height', '40')
  })

  it('passes a className through', () => {
    const { container } = render(<Art name="leek" className="tile-art" />)
    expect(container.querySelector('svg')).toHaveClass('tile-art')
  })

  it('only uses ink and the art palette', async () => {
    const { FILL, INK } = await import('./palette')
    const allowed = new Set([INK, ...Object.values(FILL), 'none'].map((c) => c.toLowerCase()))
    for (const key of ART_KEYS) {
      const { container, unmount } = render(<Art name={key} />)
      for (const el of container.querySelectorAll('[fill], [stroke]')) {
        for (const attr of ['fill', 'stroke']) {
          const value = el.getAttribute(attr)
          if (value) expect(allowed, `${key} uses ${value}`).toContain(value.toLowerCase())
        }
      }
      unmount()
    }
  })
})
