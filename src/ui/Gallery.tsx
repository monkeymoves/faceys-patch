/*
 * Dev-only page (open /?gallery) showing every UI component in every state.
 * The real screens are the place to see them composed.
 */
import { useState, type ReactNode } from 'react'
import { Art } from '../art/Art'
import { AppHeader } from './AppHeader'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card } from './Card'
import { Checkbox } from './Checkbox'
import { ConfirmDialog } from './ConfirmDialog'
import { DayCard } from './DayCard'
import { EmptyState } from './EmptyState'
import { FieldGroup } from './FieldGroup'
import { HandNote } from './HandNote'
import { ICON_NAMES } from './glyphs'
import { Icon } from './icons'
import { IconButton } from './IconButton'
import { IngredientRow } from './IngredientRow'
import { Notice } from './Notice'
import { NumberStepper } from './NumberStepper'
import { PeriodNav } from './PeriodNav'
import { ProduceTile } from './ProduceTile'
import { RecipeCard } from './RecipeCard'
import { ScreenTitle } from './ScreenTitle'
import { SearchField } from './SearchField'
import { SegmentedControl } from './SegmentedControl'
import { Select } from './Select'
import { Sheet } from './Sheet'
import { MAIN_TABS, TabBar, type MainTabId } from './TabBar'
import { TextArea } from './TextArea'
import { TextField } from './TextField'
import { ToggleChip } from './ToggleChip'
import { Wordmark } from './Wordmark'
import styles from './Gallery.module.css'

const COLOURS = [
  'paper',
  'paper-2',
  'card',
  'ink',
  'ink-2',
  'line',
  'line-strong',
  'leaf',
  'leaf-deep',
  'leaf-wash',
  'tomato',
  'tomato-deep',
  'tomato-wash',
  'marigold',
  'marigold-deep',
  'marigold-wash',
] as const

export function Gallery() {
  return <ComponentGallery />
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {note && <p className={styles.sectionNote}>{note}</p>}
      </header>
      {children}
    </section>
  )
}

function ComponentGallery() {
  const [tab, setTab] = useState<MainTabId>('cook')
  const [larder, setLarder] = useState<Record<string, boolean>>({
    'Olive oil': true,
    Butter: true,
    Eggs: false,
    Lemons: false,
    Feta: true,
  })
  const [shop, setShop] = useState<Record<string, boolean>>({ Lemons: true, Feta: false, 'Double cream': false })
  const [view, setView] = useState<'week' | 'month'>('week')
  const [filter, setFilter] = useState<'all' | 'ready' | 'veggie' | 'mine'>('ready')
  const [query, setQuery] = useState('cour')
  const [emptyQuery, setEmptyQuery] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [week, setWeek] = useState(0)
  const [title, setTitle] = useState('Courgette and mint fritters')
  const [longTitle, setLongTitle] = useState('Grandad’s proper runner bean chutney, the one with')
  const [badTitle, setBadTitle] = useState('')
  const [steps, setSteps] = useState('Grate the courgettes.\nSqueeze out the water.')
  const [course, setCourse] = useState('main')
  const [minutes, setMinutes] = useState(30)
  const [serves, setServes] = useState(1)
  const [amount, setAmount] = useState('2 big handfuls')
  const [optional, setOptional] = useState(true)

  return (
    <div className={styles.gallery}>
      <AppHeader
        nav={<TabBar tabs={MAIN_TABS} active={tab} onSelect={setTab} />}
        actions={<IconButton icon="settings" label="Settings" />}
      />
      <main className={styles.main}>
        <ScreenTitle aside="shed notebook">Design system</ScreenTitle>
        <p className={styles.lede}>Every component in every state. The app itself shows them put together.</p>

        <Section title="Wordmark" note="A seedling where the apostrophe goes.">
          <div className={styles.stack}>
            <Wordmark size="xl" />
            <Wordmark size="lg" />
            <Wordmark size="md" />
            <Wordmark size="sm" />
          </div>
        </Section>

        <Section title="Colour" note="Paper and ink with one green. Colour lives in the drawings.">
          <div className={styles.swatches}>
            {COLOURS.map((name) => (
              <div key={name} className={styles.swatch}>
                <span className={styles.chip} style={{ background: `var(--${name})` }} />
                <code>--{name}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type">
          <div className={styles.stack}>
            <p className={styles.typeDisplay}>What's ready on the plot?</p>
            <p className={styles.typeTitle}>Courgette and mint fritters</p>
            <p>
              Body text is Atkinson Hyperlegible Next at 17px, chosen for glare, muddy screens and older eyes. You'll
              need: lemon, feta.
            </p>
            <p className={styles.typeMeta}>Secondary text, 15px: 30 min, serves 4</p>
            <p>
              <HandNote>loads!</HandNote> <HandNote tone="leaf">ready Sat</HandNote>{' '}
              <HandNote tone="tomato" tilt="right">
                use me up
              </HandNote>{' '}
              <HandNote tone="ink" tilt="none" size="lg">
                Wednesday
              </HandNote>
            </p>
          </div>
        </Section>

        <Section title="Icons" note="Drawn for this app, 24px, round caps, currentColor.">
          <div className={styles.icons}>
            {ICON_NAMES.map((name) => (
              <div key={name} className={styles.iconCell}>
                <Icon name={name} />
                <Icon name={name} size={44} />
                <code>{name}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Buttons">
          <div className={styles.row}>
            <Button>Add to a day</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="ghost">Not on the list?</Button>
            <Button variant="danger">Start afresh</Button>
          </div>
          <div className={styles.row}>
            <Button icon="plus" size="sm">
              Add
            </Button>
            <Button icon="share" variant="secondary">
              Share list
            </Button>
            <Button icon="pot" size="lg">
              Cook this
            </Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </div>
          <div className={styles.narrow}>
            <Button fullWidth size="lg">
              Fill my week
            </Button>
          </div>
          <div className={styles.row}>
            <IconButton icon="settings" label="Settings" />
            <IconButton icon="close" label="Close" />
            <IconButton icon="chevronLeft" label="Previous week" variant="secondary" />
            <IconButton icon="chevronRight" label="Next week" variant="secondary" />
            <IconButton icon="plus" label="Add" variant="primary" size="lg" />
            <IconButton icon="bin" label="Remove" />
            <IconButton icon="share" label="Share" disabled />
          </div>
          <div className={styles.row}>
            <Button aria-disabled="true">Unavailable, still focusable</Button>
            <IconButton icon="plus" label="Increase, at the limit" variant="secondary" aria-disabled="true" />
          </div>
        </Section>

        <Section title="Chips and badges">
          <div className={styles.row}>
            {Object.entries(larder).map(([name, on]) => (
              <ToggleChip key={name} pressed={on} onPressedChange={(next) => setLarder({ ...larder, [name]: next })}>
                {name}
              </ToggleChip>
            ))}
          </div>
          <div className={styles.row}>
            <Badge variant="ready">Ready now</Badge>
            <Badge variant="soon">Coming soon</Badge>
            <Badge variant="glut">Loads</Badge>
            <Badge variant="ready">Ready to cook</Badge>
            <Badge variant="nearly">Need 2 things</Badge>
            <Badge variant="shop">Need 4 things</Badge>
          </div>
        </Section>

        <Section title="Choosing">
          <div className={styles.stack}>
            <SegmentedControl
              label="View"
              options={[
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
              ]}
              value={view}
              onChange={setView}
            />
            <SegmentedControl
              label="Show"
              options={[
                { value: 'all', label: 'All' },
                { value: 'ready', label: 'Ready to cook' },
                { value: 'veggie', label: 'Veggie' },
                { value: 'mine', label: 'Mine' },
              ]}
              value={filter}
              onChange={setFilter}
            />
            <div className={styles.narrow}>
              <PeriodNav
                label={['This week, 5 to 11 October', 'Next week, 12 to 18 October'][week % 2] ?? ''}
                previousLabel="Previous week"
                nextLabel="Next week"
                onPrevious={() => setWeek(week + 1)}
                onNext={() => setWeek(week + 1)}
                jump={week % 2 === 1 ? { label: 'Back to this week', onClick: () => setWeek(0) } : undefined}
              />
            </div>
            <div className={styles.grid2}>
              <SearchField label="Find a crop" value={query} onChange={setQuery} />
              <SearchField label="Search the larder" hideLabel value={emptyQuery} onChange={setEmptyQuery} placeholder="Search the larder" />
            </div>
            <div className={styles.narrow}>
              {Object.entries(shop).map(([name, on]) => (
                <Checkbox
                  key={name}
                  label={name}
                  hint={name === 'Feta' ? 'for Bean salad and Courgette fritters' : 'for Bean salad'}
                  checked={on}
                  strike
                  onCheckedChange={(next) => setShop({ ...shop, [name]: next })}
                />
              ))}
            </div>
          </div>
        </Section>

        <Section title="Form fields" note="For writing your own recipes.">
          <div className={styles.formDemo}>
            <TextField label="Title" value={title} onChange={setTitle} maxLength={60} />
            <TextField
              label="Title, near the limit"
              hint="The count only shows when you're close."
              value={longTitle}
              onChange={setLongTitle}
              maxLength={60}
            />
            <TextField
              label="Title, with a problem"
              value={badTitle}
              onChange={setBadTitle}
              error="Give it a name so you can find it again."
            />
            <TextField label="Short note" optional value="" onChange={() => {}} placeholder="e.g. Nan's, the best one" />
            <TextArea label="Method" hint="One step per line." value={steps} onChange={setSteps} />
            <Select
              label="Course"
              value={course}
              onChange={setCourse}
              options={[
                { value: 'main', label: 'Main' },
                { value: 'side', label: 'Side' },
                { value: 'soup', label: 'Soup' },
              ]}
            />
            <div className={styles.formPair}>
              <NumberStepper label="Minutes" value={minutes} onChange={setMinutes} min={5} max={600} step={5} unit="min" />
              <NumberStepper label="Serves" value={serves} onChange={setServes} min={1} max={20} />
            </div>
            <FieldGroup legend="Ingredients" hint="Tick optional for the nice-to-haves.">
              <IngredientRow
                name="Courgettes"
                art="courgette"
                amount={amount}
                onAmountChange={setAmount}
                optional={false}
                onOptionalChange={() => {}}
                onRemove={() => {}}
              />
              <IngredientRow
                name="Mint"
                art="herb-soft"
                amount="a few sprigs"
                onAmountChange={() => {}}
                optional={optional}
                onOptionalChange={setOptional}
                onRemove={() => {}}
              />
              <IngredientRow
                name="Feta"
                amount=""
                onAmountChange={() => {}}
                optional={false}
                onOptionalChange={() => {}}
                onRemove={() => {}}
              />
              <IngredientRow
                name="Lemons"
                amount="the zest and juice of two big unwaxed ones, or three small ones if that's what you have"
                amountMaxLength={80}
                onAmountChange={() => {}}
                optional={false}
                onOptionalChange={() => {}}
                onRemove={() => {}}
                error="Keep the amount to 80 characters or fewer."
              />
            </FieldGroup>
            <FieldGroup legend="Ingredients, with a problem" error="Add at least one ingredient." errorId="gallery-error">
              <SearchField label="Add an ingredient" value="" onChange={() => {}} aria-describedby="gallery-error" />
            </FieldGroup>
          </div>
        </Section>

        <Section title="Sheets and dialogs" note="Bottom sheet on phones, centred from 900px.">
          <div className={styles.row}>
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              Open a sheet
            </Button>
            <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
              Start afresh
            </Button>
          </div>
          <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Courgettes" tall>
            <div className={styles.sheetDemo}>
              <Art name="courgette" size={96} />
              <SegmentedControl
                label="Status"
                options={[
                  { value: 'ready', label: 'Ready now' },
                  { value: 'soon', label: 'Coming soon' },
                ]}
                value="ready"
                onChange={() => {}}
              />
              <Checkbox
                label="Loads of it"
                hint="A glut. Recipes that use it up come first."
                checked
                onCheckedChange={() => {}}
              />
              <Button variant="ghost" icon="bin" onClick={() => setSheetOpen(false)}>
                Take it off the patch
              </Button>
            </div>
          </Sheet>
          <ConfirmDialog
            open={confirmOpen}
            title="Start afresh?"
            message="This clears your patch, larder and week on this device. It can't be undone."
            confirmLabel="Clear everything"
            destructive
            otherAction={{ label: 'Download a backup first', icon: 'download', onClick: () => {} }}
            onConfirm={() => setConfirmOpen(false)}
            onCancel={() => setConfirmOpen(false)}
          />
        </Section>

        <Section title="Messages">
          <div className={styles.stack}>
            <Notice tone="problem" title="Your saved data couldn't be read">
              So the app has started afresh and kept a copy, in case you want it.
            </Notice>
            <Notice tone="success" onDismiss={() => {}}>
              3 things put in the larder.
            </Notice>
            <Notice
              tone="success"
              live={false}
              action={
                <Button size="sm" variant="secondary">
                  Undo
                </Button>
              }
              onDismiss={() => {}}
            >
              Took courgettes off the patch.
            </Notice>
            <Notice tone="info">Your data stays on this phone. Export a backup to move it.</Notice>
          </div>
        </Section>

        <Section title="Titles and empty states">
          <div className={styles.stack}>
            <ScreenTitle aside="ready Sat" action={<Button icon="plus" size="sm">Add</Button>} as="h2">
              What's ready?
            </ScreenTitle>
            <Card tone="sunken" padding="none">
              <EmptyState
                art={<Art name="seedling" size={96} />}
                title="Nothing on the patch yet"
                action={<Button icon="plus">Add what's ready</Button>}
              >
                Add what's ready on the plot and recipes that use it will turn up.
              </EmptyState>
            </Card>
            <div className={styles.grid2}>
              <Card>
                <strong>Card, raised.</strong> White paper on the page, a hand-cut edge, no shadow.
              </Card>
              <Card tone="sunken">
                <strong>Card, sunken.</strong> A recessed panel for grouping.
              </Card>
            </div>
          </div>
        </Section>

        <Section title="Patch tiles">
          <ul role="list" className={styles.tileGrid}>
            <li>
              <ProduceTile name="Courgettes" art="courgette" status="ready" glut />
            </li>
            <li>
              <ProduceTile name="Runner beans" art="bean" status="ready" />
            </li>
            <li>
              <ProduceTile name="Sweetcorn" art="sweetcorn" status="soon" />
            </li>
            <li>
              <ProduceTile name="Purple sprouting broccoli" art="broccoli" status="soon" glut />
            </li>
          </ul>
        </Section>

        <Section title="Recipe cards">
          <ul role="list" className={styles.recipeList}>
            <li>
              <RecipeCard
                title="Courgette and mint fritters"
                minutes={30}
                serves={4}
                uses={[
                  { art: 'courgette', name: 'courgettes' },
                  { art: 'herb-soft', name: 'mint' },
                ]}
                readiness="ready"
                note="uses your glut"
              />
            </li>
            <li>
              <RecipeCard
                title="Runner bean and tomato salad with feta"
                minutes={20}
                serves={2}
                uses={[
                  { art: 'bean', name: 'runner beans' },
                  { art: 'tomato', name: 'tomatoes' },
                ]}
                readiness="nearly"
                missing={['lemon', 'feta']}
              />
            </li>
            <li>
              <RecipeCard
                title="Chard and beetroot gratin"
                minutes={70}
                serves={4}
                uses={[
                  { art: 'chard', name: 'chard' },
                  { art: 'beetroot', name: 'beetroot' },
                  { art: 'onion', name: 'onion' },
                  { art: 'garlic', name: 'garlic' },
                ]}
                readiness="shop"
                missing={['double cream', 'Gruyère', 'breadcrumbs']}
              />
            </li>
          </ul>
        </Section>

        <Section title="Day cards">
          <ul role="list" className={styles.dayList}>
            <li>
              <DayCard
                dayName="Tuesday"
                dayNumber={6}
                label="Tuesday 6 October"
                past
                meals={[{ id: '1', title: 'Roast tomato soup', cooked: true }]}
                onSelectMeal={() => {}}
                onAddMeal={() => {}}
              />
            </li>
            <li>
              <DayCard
                dayName="Wednesday"
                dayNumber={7}
                label="Wednesday 7 October"
                today
                meals={[
                  { id: '2', title: 'Courgette and mint fritters', cooked: false },
                  { id: '3', title: 'Green salad', cooked: true },
                ]}
                onSelectMeal={() => {}}
                onAddMeal={() => {}}
              />
            </li>
            <li>
              <DayCard
                dayName="Thursday"
                dayNumber={8}
                label="Thursday 8 October"
                meals={[]}
                onSelectMeal={() => {}}
                onAddMeal={() => {}}
              />
            </li>
          </ul>
        </Section>
      </main>
    </div>
  )
}
