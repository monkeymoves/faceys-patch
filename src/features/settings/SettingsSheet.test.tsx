import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialState, MAX_BACKUP_BYTES, serializeBackup, type AppState } from '../../domain'
import { renderWithApp } from '../../test/render'
import { SettingsSheet } from './SettingsSheet'

const HERE: Partial<AppState> = {
  harvest: [{ ingredientId: 'courgette', status: 'ready', glut: true, addedOn: '2026-10-01' }],
  larder: ['olive-oil', 'egg'],
}

const BACKED_UP: AppState = {
  ...initialState(),
  harvest: [
    { ingredientId: 'tomato', status: 'ready', glut: false, addedOn: '2026-09-20' },
    { ingredientId: 'leek', status: 'soon', glut: false, addedOn: '2026-09-21' },
  ],
  larder: ['feta'],
  plan: {
    '2026-09-22': [{ id: 'meal-1', recipeId: 'ratatouille', cooked: true }],
    '2026-09-23': [{ id: 'meal-2', recipeId: 'shakshuka', cooked: false }],
  },
}

const jsonFile = (text: string) => new File([text], 'backup.json', { type: 'application/json' })
const fileInput = () => screen.getByLabelText<HTMLInputElement>('Backup file')

function renderSettings(state: Partial<AppState> = HERE) {
  const onClose = vi.fn()
  return { ...renderWithApp(<SettingsSheet open onClose={onClose} />, { state }), onClose }
}

describe('SettingsSheet', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 7, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    Reflect.deleteProperty(URL, 'createObjectURL')
    Reflect.deleteProperty(URL, 'revokeObjectURL')
  })

  it('says plainly where the data lives, and how to install the app', () => {
    renderSettings()
    const sheet = screen.getByRole('dialog', { name: 'Settings' })
    expect(sheet).toHaveTextContent('Everything is saved on this device. Nothing is sent anywhere.')
    const app = within(sheet).getByRole('region', { name: 'Use it like an app' })
    expect(app).toHaveTextContent('tap Share, then Add to Home Screen')
    expect(app).toHaveTextContent('tap the menu, then Install app')
  })

  it('downloads a dated backup through a temporary link, then lets the link go', async () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:faceys-backup')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true })
    const clicked: { href: string | null; download: string }[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ href: this.getAttribute('href'), download: this.download })
    })

    const { user } = renderSettings()
    await user.click(screen.getByRole('button', { name: 'Download a backup' }))

    expect(clicked).toEqual([{ href: 'blob:faceys-backup', download: 'faceys-patch-backup-2026-10-07.json' }])
    const blob = createObjectURL.mock.calls[0]?.[0]
    expect(blob?.type).toBe('application/json')
    expect(JSON.parse((await blob?.text()) ?? '')).toEqual({
      app: 'faceys-patch',
      exportedAt: new Date(2026, 9, 7, 12).toISOString(),
      state: { ...initialState(), ...HERE },
    })
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:faceys-backup'))
    expect(document.querySelector('a[download]')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Backup saved as faceys-patch-backup-2026-10-07.json.')
  })

  it("says so if the backup can't be made", async () => {
    Object.defineProperty(URL, 'createObjectURL', {
      value: () => {
        throw new Error('No blobs here')
      },
      configurable: true,
    })
    const { user } = renderSettings()
    await user.click(screen.getByRole('button', { name: 'Download a backup' }))
    expect(screen.getByRole('alert')).toHaveTextContent("The backup couldn't be made.")
  })

  it('loads a backup after a confirm that says what is in it', async () => {
    const { user, saved } = renderSettings()
    await user.upload(fileInput(), jsonFile(serializeBackup(BACKED_UP, new Date(2026, 8, 30))))

    const confirm = await screen.findByRole('dialog', { name: 'Replace everything with this backup?' })
    expect(confirm).toHaveTextContent(
      'It has 2 things on the patch, 1 thing in the larder, 2 planned meals and no recipes of your own.',
    )
    expect(within(confirm).getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await user.click(within(confirm).getByRole('button', { name: 'Replace everything' }))

    expect(saved()).toEqual(BACKED_UP)
    expect(screen.queryByRole('dialog', { name: 'Replace everything with this backup?' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Backup loaded.')
  })

  it('changes nothing when the load is cancelled', async () => {
    const { user, saved } = renderSettings()
    await user.upload(fileInput(), jsonFile(serializeBackup(BACKED_UP, new Date())))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(saved()).toEqual({ ...initialState(), ...HERE })
    expect(screen.queryByRole('dialog', { name: 'Replace everything with this backup?' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  })

  it('refuses a damaged backup with a friendly reason', async () => {
    const { user, saved } = renderSettings()
    const damaged = JSON.stringify({ app: 'faceys-patch', exportedAt: '', state: { version: 1, harvest: 'lots' } })
    await user.upload(fileInput(), jsonFile(damaged))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "That backup is damaged, so it can't be loaded. Nothing has been changed.",
    )
    expect(screen.queryByRole('dialog', { name: 'Replace everything with this backup?' })).not.toBeInTheDocument()
    expect(saved()).toEqual({ ...initialState(), ...HERE })
  })

  it("refuses a file that isn't JSON", async () => {
    const { user } = renderSettings()
    await user.upload(fileInput(), jsonFile('not json at all'))
    expect(await screen.findByRole('alert')).toHaveTextContent("That file can't be read.")
  })

  it('refuses a file that is too big without reading it', async () => {
    const read = vi.spyOn(Blob.prototype, 'text')
    const { user } = renderSettings()
    await user.upload(fileInput(), jsonFile('x'.repeat(MAX_BACKUP_BYTES + 1)))

    expect(await screen.findByRole('alert')).toHaveTextContent("That file is too big to be a Facey's Patch backup.")
    expect(read).not.toHaveBeenCalled()
  })

  it('starts afresh only after a clear warning', async () => {
    const { user, saved } = renderSettings()
    await user.click(screen.getByRole('button', { name: 'Start afresh' }))

    const confirm = screen.getByRole('dialog', { name: 'Start afresh?' })
    expect(confirm).toHaveTextContent('clears your patch, larder, plans and your own recipes on this device')
    expect(confirm).toHaveTextContent('download a backup first')
    expect(within(confirm).getByRole('button', { name: 'Cancel' })).toHaveFocus()

    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }))
    expect(saved()).toEqual({ ...initialState(), ...HERE })

    await user.click(screen.getByRole('button', { name: 'Start afresh' }))
    await user.click(screen.getByRole('button', { name: 'Clear everything' }))
    expect(saved()).toEqual(initialState())
    expect(screen.getByRole('status')).toHaveTextContent('All cleared.')
  })

  it('forgets its messages when closed', async () => {
    const { user, onClose } = renderSettings()
    await user.upload(fileInput(), jsonFile('nope'))
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
