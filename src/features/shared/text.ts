/*
 * Small text helpers shared by every screen: searching names, sorting them,
 * and writing them mid-sentence. Pure, no React.
 */

/** Lower-case, accents off, single spaces, trimmed: so 'gruyere ' finds 'Gruyère'. */
export function fold(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en-GB')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Case and accent insensitive "contains", so 'creme' finds Crème fraîche. An empty query matches everything. */
export const matchesQuery = (name: string, query: string) => fold(name).includes(fold(query))

/** The same name, ignoring case, accents and extra spaces. */
export const sameName = (a: string, b: string) => fold(a) === fold(b)

/** A to Z by name, the British way. */
export const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'en-GB')

/**
 * A name as it reads mid-sentence: 'Courgettes' becomes 'courgettes'. Only the
 * first letter changes, and a first word in capitals ('BBQ sauce') is left alone.
 */
export function midSentence(name: string): string {
  const [firstWord = ''] = name.split(' ')
  const acronym = firstWord.length > 1 && /\p{Lu}/u.test(firstWord) && firstWord === firstWord.toLocaleUpperCase('en-GB')
  if (acronym) return name
  return name.charAt(0).toLocaleLowerCase('en-GB') + name.slice(1)
}

/** 'oca' to 'Oca', for a name typed in lower case. */
export const capitalise = (text: string) => text.charAt(0).toLocaleUpperCase('en-GB') + text.slice(1)

/** '1 recipe', '12 recipes'. */
export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`
