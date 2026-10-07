import { describe, expect, it } from 'vitest'
import { parseHash, routeToHash } from './routes'

describe('parseHash', () => {
  it.each([
    ['', { tab: 'patch' }],
    ['#', { tab: 'patch' }],
    ['#/week', { tab: 'week' }],
    ['#week', { tab: 'week' }],
    ['#/cook?with=courgette', { tab: 'cook', with: 'courgette' }],
    ['#/shop?with=courgette', { tab: 'shop' }],
    ['#/nonsense', { tab: 'patch' }],
    ['#/cook?with=', { tab: 'cook' }],
  ])('%s -> %o', (hash, route) => {
    expect(parseHash(hash)).toEqual(route)
  })
})

describe('routeToHash', () => {
  it('round-trips through parseHash', () => {
    for (const route of [{ tab: 'larder' }, { tab: 'cook', with: 'runner-bean' }] as const) {
      expect(parseHash(routeToHash(route))).toEqual(route)
    }
  })

  it('encodes awkward ids safely', () => {
    expect(parseHash(routeToHash({ tab: 'cook', with: 'my-a&b=c' }))).toEqual({ tab: 'cook', with: 'my-a&b=c' })
  })
})
