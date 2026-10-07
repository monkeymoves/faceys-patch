import { useNavigation } from '../../app/useNavigation'
import { useStore } from '../../app/useStore'
import { Art } from '../../art/Art'
import type { HarvestItem, IngredientId } from '../../domain'
import { Button } from '../../ui/Button'
import { Checkbox } from '../../ui/Checkbox'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { Sheet } from '../../ui/Sheet'
import { midSentence } from '../shared/text'
import { patchCrops, STATUS_OPTIONS, type Crop } from './crops'
import styles from './Patch.module.css'

export interface CropSheetProps {
  /** The crop to show, or null when closed. */
  cropId: IngredientId | null
  onClose: () => void
  /** Called after the crop is taken off the patch, with how it was, so it can be put back. */
  onRemoved: (removed: HarvestItem) => void
}

/** Tap a tile to get this: change how ready it is, mark a glut, find recipes, or take it off. */
export function CropSheet({ cropId, onClose, onRemoved }: CropSheetProps) {
  const { state, catalogue } = useStore()
  const crop = patchCrops(state.harvest, catalogue).find((candidate) => candidate.id === cropId)
  return (
    <Sheet open={crop !== undefined} onClose={onClose} title={crop?.name ?? ''}>
      {crop && <CropDetails crop={crop} onClose={onClose} onRemoved={onRemoved} />}
    </Sheet>
  )
}

interface CropDetailsProps {
  crop: Crop
  onClose: () => void
  onRemoved: (removed: HarvestItem) => void
}

function CropDetails({ crop, onClose, onRemoved }: CropDetailsProps) {
  const { state, dispatch } = useStore()
  const { go } = useNavigation()
  const { id, name, art, status, glut } = crop

  return (
    <div className={styles.crop}>
      <div className={styles.cropArt}>
        <Art name={art} size={128} />
      </div>
      <SegmentedControl
        label="How ready is it?"
        options={STATUS_OPTIONS}
        value={status}
        onChange={(next) => dispatch({ type: 'harvest/update', ingredientId: id, status: next })}
        className={styles.fullSegments}
      />
      <Checkbox
        label="Loads of it"
        hint="A glut. Recipes that use it up come first."
        checked={glut}
        onCheckedChange={(next) => dispatch({ type: 'harvest/update', ingredientId: id, glut: next })}
      />
      <div className={styles.cropActions}>
        <Button
          variant="secondary"
          icon="pot"
          fullWidth
          onClick={() => {
            onClose()
            go({ tab: 'cook', with: id })
          }}
        >
          See recipes with {midSentence(name)}
        </Button>
        <Button
          variant="ghost"
          icon="bin"
          fullWidth
          onClick={() => {
            const removed = state.harvest.find((item) => item.ingredientId === id)
            dispatch({ type: 'harvest/remove', ingredientId: id })
            if (removed) onRemoved(removed)
          }}
        >
          Take it off the patch
        </Button>
      </div>
    </div>
  )
}
