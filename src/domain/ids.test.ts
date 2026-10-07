import { describe, expect, it } from 'vitest'
import { makeMyId } from './ids'

const lowest = () => 0
const highest = () => 0.999999999

describe('makeMyId (SPEC: new ids are my- plus a slug plus a short random suffix)', () => {
  it('is my-, a kebab-case slug of the text, then a short base36 suffix', () => {
    expect(makeMyId('Courgette Chutney', lowest)).toBe('my-courgette-chutney-00000')
    expect(makeMyId('Courgette Chutney', highest)).toBe('my-courgette-chutney-zzzzz')
  })

  it('folds accents to plain ASCII and drops apostrophes', () => {
    expect(makeMyId('Jalapeño & lime salsa', lowest)).toBe('my-jalapeno-lime-salsa-00000')
    expect(makeMyId("  Granny's   Apple Pie!! ", lowest)).toBe('my-grannys-apple-pie-00000')
  })

  it('keeps the slug to 30 characters with no dangling hyphen', () => {
    expect(makeMyId('Roasted squash and sage soups with crispy shallots', lowest)).toBe(
      'my-roasted-squash-and-sage-soups-00000',
    )
    expect(makeMyId('Roast beetroot and goat cheese tart', lowest)).toBe('my-roast-beetroot-and-goat-cheese-00000')
  })

  it.each(['', '   ', '!!!', '茄子'])('falls back to "item" when %j leaves nothing to slug', (text) => {
    expect(makeMyId(text, lowest)).toBe('my-item-00000')
  })

  it('uses Math.random by default and always fits the 64 character id limit', () => {
    const id = makeMyId('A very long name for a very ordinary bunch of radishes from plot nine')
    expect(id).toMatch(/^my-[a-z0-9]+(-[a-z0-9]+)*-[a-z0-9]{5}$/)
    expect(id.length).toBeLessThanOrEqual(64)
  })
})
