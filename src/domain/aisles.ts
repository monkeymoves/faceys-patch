import type { Aisle } from './types'

/** Headings for Larder groups and the Shop list. */
export const AISLE_LABELS: Readonly<Record<Aisle, string>> = {
  veg: 'Veg',
  fruit: 'Fruit',
  herbs: 'Herbs',
  'dairy-eggs': 'Dairy and eggs',
  'meat-fish': 'Meat and fish',
  'bread-pastry': 'Bread and pastry',
  'dry-goods': 'Dry goods',
  'tins-jars': 'Tins and jars',
  'oils-sauces': 'Oils and sauces',
  spices: 'Spices',
}
