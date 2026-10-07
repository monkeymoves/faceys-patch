import { within } from '@testing-library/react'

/** Everything the live regions in `container` are reading out, trimmed (a repeat gains a trailing space). */
export function announced(container: HTMLElement = document.body): string[] {
  return within(container)
    .queryAllByRole('status')
    .flatMap((region) => region.textContent?.trim() || [])
}

/** Text on screen, leaving out the hidden live regions that read the same words out. */
export function shown(text: string | RegExp, container: HTMLElement = document.body): HTMLElement {
  return within(container).getByText(text, { ignore: '[role="status"], script, style' })
}
