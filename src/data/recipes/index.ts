import type { Recipe } from '../../domain/types'
import { BAKES, PUDDINGS } from './bakes-and-puddings'
import { MEAT_MAINS } from './mains-meat'
import { VEG_MAINS } from './mains-veg'
import { PRESERVES } from './preserves'
import { SALADS, SIDES } from './salads-and-sides'
import { SOUPS } from './soups'

export const RECIPES: readonly Recipe[] = [
  ...SOUPS,
  ...SALADS,
  ...SIDES,
  ...VEG_MAINS,
  ...MEAT_MAINS,
  ...BAKES,
  ...PUDDINGS,
  ...PRESERVES,
]
