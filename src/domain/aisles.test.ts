import { describe, expect, it } from 'vitest'
import { AISLE_LABELS } from './aisles'
import { AISLES } from './types'

describe('AISLE_LABELS', () => {
  it('names every aisle in plain words', () => {
    expect(AISLES.map((aisle) => AISLE_LABELS[aisle])).toEqual([
      'Veg',
      'Fruit',
      'Herbs',
      'Dairy and eggs',
      'Meat and fish',
      'Bread and pastry',
      'Dry goods',
      'Tins and jars',
      'Oils and sauces',
      'Spices',
    ])
  })
})
