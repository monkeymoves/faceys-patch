import { useNavigation } from '../../app/useNavigation'
import { useStore } from '../../app/useStore'
import { Art } from '../../art/Art'
import type { IngredientId } from '../../domain'
import { Button } from '../../ui/Button'
import { Checkbox } from '../../ui/Checkbox'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { Sheet } from '../../ui/Sheet'
import { midSentence, patchCrops, STATUS_OPTIONS, type Crop } from './crops'
import styles from './Patch.module.css'

export interface CropSheetProps {
  /** The crop to show, or null when closed. */
  cropId: IngredientId | null
  onClose: () => void
  /** Called after the crop is taken off the patch, once the sheet has closed. */
  onRemoved: () => void
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

function CropDetails({ crop, onClose, onRemoved }: { crop: Crop; onClose: () => void; onRemoved: () => void }) {
  const { dispatch } = useStore()
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
        hint="Recipes that use it up come first."
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
            dispatch({ type: 'harvest/remove', ingredientId: id })
            onRemoved()
          }}
        >
          Take off the patch
        </Button>
      </div>
    </div>
  )
}
