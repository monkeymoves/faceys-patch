import type { ReactElement } from 'react'
import type { ArtKey } from '../../domain/types'

/** One illustration: the inner content of a 64x64 viewBox. */
export type Drawing = () => ReactElement

/** A group of drawings (veg, fruit, herbs). Typos in keys are caught here. */
export type DrawingSet = Partial<Record<ArtKey, Drawing>>
