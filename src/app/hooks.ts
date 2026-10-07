import { useMemo } from 'react'
import { matchRecipes, type RecipeMatch, type Supplies } from '../domain'
import { useStore } from './useStore'

/** What the person has to cook with: the full catalogue, their patch and their larder. */
export function useSupplies(): Supplies {
  const { catalogue, state } = useStore()
  return useMemo(
    () => ({ catalogue, harvest: state.harvest, larder: state.larder }),
    [catalogue, state.harvest, state.larder],
  )
}

/** Recipes using something from the patch, best first. Recomputed only when supplies change. */
export function useMatches(): RecipeMatch[] {
  const supplies = useSupplies()
  return useMemo(() => matchRecipes(supplies), [supplies])
}
