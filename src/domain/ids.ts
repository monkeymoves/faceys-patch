import { MY_ID_PREFIX } from './types'

const MAX_SLUG_LENGTH = 30
const SUFFIX_LENGTH = 5

function slugify(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '')
  return slug || 'item'
}

/**
 * A new id for something the user wrote: 'my-' + slug of `text` + '-' + a
 * short random base36 suffix, e.g. 'my-courgette-chutney-k3x9q'. Pure given `random`.
 */
export function makeMyId(text: string, random: () => number = Math.random): string {
  const suffix = Math.floor(random() * 36 ** SUFFIX_LENGTH)
    .toString(36)
    .padStart(SUFFIX_LENGTH, '0')
  return `${MY_ID_PREFIX}${slugify(text)}-${suffix}`
}
