import { AISLES, type Aisle, type Catalogue, type Ingredient } from '../../domain'

export const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'en-GB')

/** Everything that can go in the larder (all but salt, pepper and water), A to Z. */
export function stockable(catalogue: Catalogue): Ingredient[] {
  return [...catalogue.ingredients.values()].filter((ingredient) => !ingredient.assumed).sort(byName)
}

/** `ingredients` split by aisle, in shop order, leaving out empty aisles. Keeps the order within each. */
export function byAisle(ingredients: readonly Ingredient[]): { aisle: Aisle; items: Ingredient[] }[] {
  return AISLES.map((aisle) => ({ aisle, items: ingredients.filter((ingredient) => ingredient.aisle === aisle) })).filter(
    (group) => group.items.length > 0,
  )
}

const fold = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en-GB')
    .trim()

/** Case and accent insensitive "contains", so 'creme' finds Crème fraîche. */
export const matchesQuery = (name: string, query: string) => fold(name).includes(fold(query))

/** Same name, ignoring case and accents. */
export const sameName = (a: string, b: string) => fold(a) === fold(b)
