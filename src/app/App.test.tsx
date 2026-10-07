import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../domain'
import { App } from './App'

describe('App shell', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  it('opens on the Patch tab and switches tabs from the tab bar', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('button', { name: 'Patch' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Week' }))
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-current', 'page')
    expect(window.location.hash).toBe('#/week')
  })

  it('tells the person when saved data could not be read', () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    render(<App />)
    expect(screen.getByRole('alert')).toHaveTextContent("Your saved patch couldn't be read")
  })

  it('opens settings from the header', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  })
})

describe('focus on tab change', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  it("leaves focus alone on first load, then moves it to the new screen's title", async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(document.activeElement).toBe(document.body)

    await user.click(screen.getByRole('button', { name: 'Larder' }))
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }))
    expect(document.title).toBe("Larder | Facey's Patch")
  })

  it('lets keyboard users skip past the tabs to the screen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Skip to content' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }))
  })
})
