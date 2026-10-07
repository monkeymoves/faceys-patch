import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY } from '../domain'
import { pwaStub } from '../test/pwaRegisterStub'
import { App } from './App'
import { ErrorBoundary } from './ErrorBoundary'

function Broken(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a way out instead of a blank screen, and says the data is safe', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('heading', { name: "Something's gone wrong" })).toBeInTheDocument()
    expect(screen.getByText(/still saved on this device/)).toBeInTheDocument()
    for (const name of ['Reload', 'Download your data', 'Start afresh']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('downloads the saved data exactly as stored', async () => {
    localStorage.setItem(STORAGE_KEY, '{"version":1}')
    const created: Blob[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      created.push(blob as Blob)
      return 'blob:test'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'Download your data' }))
    expect(await created[0]?.text()).toBe('{"version":1}')
  })
})

describe('StorageNotice', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.location.hash = ''
  })

  it('offers the unreadable data as a download', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    const created: Blob[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      created.push(blob as Blob)
      return 'blob:test'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    render(<App />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Download the old data' }))
    expect(await created[0]?.text()).toBe('{broken')
  })
})

describe('UpdateNotice', () => {
  afterEach(() => {
    pwaStub.needRefresh = false
    pwaStub.updates = 0
    window.location.hash = ''
  })

  it('stays quiet when there is nothing new', () => {
    render(<App />)
    expect(screen.queryByText('A new version is ready')).not.toBeInTheDocument()
  })

  it('offers a new version rather than reloading by itself', async () => {
    pwaStub.needRefresh = true
    render(<App />)
    expect(screen.getByText('A new version is ready')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Update now' }))
    expect(pwaStub.updates).toBe(1)
  })
})
