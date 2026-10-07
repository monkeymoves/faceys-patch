import { describe, expect, it } from 'vitest'
import { byName, capitalise, fold, matchesQuery, midSentence, plural, sameName } from './text'

describe('fold', () => {
  it('drops case, accents and extra spaces', () => {
    expect(fold('  Crème   Fraîche ')).toBe('creme fraiche')
    expect(fold('GRUYÈRE')).toBe('gruyere')
  })
})

describe('matchesQuery', () => {
  it('finds a name containing the query, whatever the case or accents', () => {
    expect(matchesQuery('Crème fraîche', 'creme')).toBe(true)
    expect(matchesQuery('Gruyère', 'GRUYERE')).toBe(true)
    expect(matchesQuery('Runner beans', 'bean')).toBe(true)
    expect(matchesQuery('Runner beans', 'kale')).toBe(false)
  })

  it('matches everything for an empty or blank query', () => {
    expect(matchesQuery('Kale', '')).toBe(true)
    expect(matchesQuery('Kale', '   ')).toBe(true)
  })
})

describe('sameName', () => {
  it('ignores case, accents and spaces round the edges', () => {
    expect(sameName('Mushrooms', ' mushrooms ')).toBe(true)
    expect(sameName('Gruyère', 'gruyere')).toBe(true)
    expect(sameName('Mushrooms', 'Mushroom')).toBe(false)
  })
})

describe('byName', () => {
  it('sorts A to Z', () => {
    const sorted = [{ name: 'Tomatoes' }, { name: 'apples' }, { name: 'Beetroot' }].sort(byName)
    expect(sorted.map((item) => item.name)).toEqual(['apples', 'Beetroot', 'Tomatoes'])
  })
})

describe('midSentence', () => {
  it('lower-cases the first letter so a name reads naturally in a sentence', () => {
    expect(midSentence('Courgettes')).toBe('courgettes')
    expect(midSentence("Goat's cheese")).toBe("goat's cheese")
  })

  it('leaves a first word in capitals alone', () => {
    expect(midSentence('BBQ sauce')).toBe('BBQ sauce')
  })
})

describe('capitalise', () => {
  it('upper-cases the first letter only', () => {
    expect(capitalise('oca root')).toBe('Oca root')
    expect(capitalise('')).toBe('')
  })
})

describe('plural', () => {
  it('counts things in words', () => {
    expect(plural(1, 'recipe', 'recipes')).toBe('1 recipe')
    expect(plural(0, 'recipe', 'recipes')).toBe('0 recipes')
    expect(plural(12, 'thing', 'things')).toBe('12 things')
  })
})
