import { AISLES, type Aisle, type Catalogue, type Ingredient } from '../../domain'
import { byName, midSentence } from '../shared/text'

/** Everything that can go in the larder (all but salt, pepper and water), A to Z. */
export function stockable(catalogue: Catalogue): Ingredient[] {
  return [...catalogue.ingredients.values()].filter((ingredient) => !ingredient.assumed).sort(byName)
}

/** `ingredients` split by aisle, in shop order, leaving out empty aisles. Keeps the order within each. */
export function byAisle(ingredients: readonly Ingredient[]): { aisle: Aisle; items: Ingredient[] }[] {
  return AISLES.map((aisle) => ({
    aisle,
    items: ingredients.filter((ingredient) => ingredient.aisle === aisle),
  })).filter((group) => group.items.length > 0)
}

/** 'Added feta to the larder.' */
export const addedToLarder = (name: string) => `Added ${midSentence(name)} to the larder.`

/** 'Took feta out of the larder.' */
export const tookOutOfLarder = (name: string) => `Took ${midSentence(name)} out of the larder.`

/** 'No need, salt is always counted as in the larder.' */
export const alwaysThere = (name: string) => `No need, ${midSentence(name)} is always counted as in the larder.`
