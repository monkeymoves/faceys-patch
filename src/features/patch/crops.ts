import {
  formatMonthLabel,
  parseISODate,
  type ArtKey,
  type Catalogue,
  type HarvestItem,
  type HarvestStatus,
  type Ingredient,
  type IngredientId,
  type ISODate,
} from '../../domain'
import { byName, midSentence } from '../shared/text'

/** A crop on the patch, joined with what the catalogue says about it. */
export interface Crop {
  id: IngredientId
  name: string
  art: ArtKey
  status: HarvestStatus
  glut: boolean
}

export const STATUS_OPTIONS = [
  { value: 'ready', label: 'Ready now' },
  { value: 'soon', label: 'Coming soon' },
] as const satisfies readonly { value: HarvestStatus; label: string }[]

export const artFor = (ingredient: Ingredient): ArtKey => ingredient.art ?? 'seedling'

/** What's on the patch, A to Z. Crops the catalogue no longer knows are skipped. */
export function patchCrops(harvest: readonly HarvestItem[], catalogue: Catalogue): Crop[] {
  return harvest
    .flatMap((item) => {
      const ingredient = catalogue.ingredients.get(item.ingredientId)
      if (!ingredient) return []
      return [{ id: item.ingredientId, name: ingredient.name, art: artFor(ingredient), status: item.status, glut: item.glut }]
    })
    .sort(byName)
}

/** Everything that can go on the patch, including the person's own, A to Z. */
export function growables(catalogue: Catalogue): Ingredient[] {
  return [...catalogue.ingredients.values()].filter((ingredient) => ingredient.growable).sort(byName)
}

/** 1 to 12 for the month `today` falls in. */
export const monthOf = (today: ISODate) => parseISODate(today).getMonth() + 1

/** 'October' */
export function monthName(today: ISODate): string {
  const label = formatMonthLabel(parseISODate(today).getFullYear(), monthOf(today))
  return label.slice(0, label.lastIndexOf(' '))
}

export const inSeason = (ingredient: Ingredient, month: number) => ingredient.harvestMonths?.includes(month) ?? false

/**
 * A handful of crops to suggest on an empty patch: the most seasonal first
 * (shortest harvest window that includes this month), one per drawing.
 */
export function seasonalPicks(catalogue: Catalogue, month: number, count: number): Ingredient[] {
  const seen = new Set<ArtKey>()
  return growables(catalogue)
    .filter((ingredient) => inSeason(ingredient, month))
    .sort((a, b) => (a.harvestMonths?.length ?? 0) - (b.harvestMonths?.length ?? 0) || byName(a, b))
    .filter((ingredient) => {
      const art = artFor(ingredient)
      if (seen.has(art)) return false
      seen.add(art)
      return true
    })
    .slice(0, count)
}

/** 'Added courgettes to the patch.' */
export const addedToPatch = (name: string) => `Added ${midSentence(name)} to the patch.`

/** 'Took courgettes off the patch.' */
export const tookOffPatch = (name: string) => `Took ${midSentence(name)} off the patch.`
