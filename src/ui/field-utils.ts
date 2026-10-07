import { useId } from 'react'

/** Ids for a form control and the text that describes it. */
export function useFieldIds() {
  const base = useId()
  return { control: `${base}-control`, hint: `${base}-hint`, error: `${base}-error`, count: `${base}-count` }
}

/** Joins the ids that apply into an aria-describedby value. Pass falsy for the ones that don't. */
export function describedBy(...ids: unknown[]): string | undefined {
  const joined = ids.filter((id): id is string => typeof id === 'string' && id !== '').join(' ')
  return joined === '' ? undefined : joined
}

/** True once you're within 20% of the limit, when the quiet count appears. */
export function nearLimit(length: number, maxLength: number | undefined) {
  return maxLength !== undefined && length >= Math.floor(maxLength * 0.8)
}
