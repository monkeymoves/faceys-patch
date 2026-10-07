import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

// jsdom has <dialog> but no showModal() or close(). This minimal stand-in mirrors
// what browsers do for the parts the UI relies on: the open attribute, focusing the
// first focusable child, Escape firing a cancelable 'cancel', and a 'close' event.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  const focusable =
    '[autofocus], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
  const openModals: HTMLDialogElement[] = []

  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    if (this.open) return
    this.open = true
    openModals.push(this)
    this.querySelector<HTMLElement>(focusable)?.focus()
  }

  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return
    this.open = false
    openModals.splice(openModals.indexOf(this), 1)
    this.dispatchEvent(new Event('close'))
  }

  document.addEventListener('keydown', (event) => {
    const top = openModals.at(-1)
    if (event.key !== 'Escape' || !top) return
    const cancel = new Event('cancel', { cancelable: true })
    if (top.dispatchEvent(cancel)) top.close()
  })
}
