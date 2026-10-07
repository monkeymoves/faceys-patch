import type { ArtKey } from '../../domain/types'
import { fruit } from './fruit'
import { herbs } from './herbs'
import type { Drawing } from './types'
import { veg } from './veg'

/** Every illustration, keyed by ArtKey. TypeScript fails the build if one is missing. */
export const drawings: Record<ArtKey, Drawing> = { ...veg, ...fruit, ...herbs }
