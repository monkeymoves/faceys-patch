/*
 * Dev-only mock screens for the gallery (/?gallery&screen=patch, cook, week).
 * Composed purely from the design system with made-up data, so the overall
 * feel can be judged at real phone and desktop widths.
 */
import { useState, type ReactNode } from 'react'
import type { ArtKey, HarvestStatus, Readiness } from '../domain/types'
import { AppHeader } from './AppHeader'
import { Button } from './Button'
import { DayCard, type DayMeal } from './DayCard'
import { IconButton } from './IconButton'
import { Notice } from './Notice'
import { Page } from './Page'
import { ProduceTile } from './ProduceTile'
import { RecipeCard, type RecipeCardVeg } from './RecipeCard'
import { RecipeFormSheet } from './GalleryRecipeForm'
import { ScreenTitle } from './ScreenTitle'
import { SegmentedControl } from './SegmentedControl'
import { MAIN_TABS, TabBar, type MainTabId } from './TabBar'
import styles from './Gallery.module.css'

export type MockScreen = 'patch' | 'cook' | 'week'

interface Crop {
  name: string
  art: ArtKey
  status: HarvestStatus
  glut?: boolean
}

const PATCH: readonly Crop[] = [
  { name: 'Courgettes', art: 'courgette', status: 'ready', glut: true },
  { name: 'Runner beans', art: 'bean', status: 'ready' },
  { name: 'Tomatoes', art: 'tomato', status: 'ready' },
  { name: 'Chard', art: 'chard', status: 'ready' },
  { name: 'Beetroot', art: 'beetroot', status: 'ready' },
  { name: 'Mint', art: 'herb-soft', status: 'ready' },
  { name: 'Sweetcorn', art: 'sweetcorn', status: 'soon' },
  { name: 'Leeks', art: 'leek', status: 'soon' },
  { name: 'Pumpkin', art: 'pumpkin', status: 'soon' },
]

interface MockRecipe {
  title: string
  minutes: number
  serves: number
  uses: readonly RecipeCardVeg[]
  readiness: Readiness
  missing?: readonly string[]
  note?: string
  veggie: boolean
}

const RECIPES: readonly MockRecipe[] = [
  {
    title: 'Courgette and mint fritters',
    minutes: 30,
    serves: 4,
    uses: [
      { art: 'courgette', name: 'courgettes' },
      { art: 'herb-soft', name: 'mint' },
    ],
    readiness: 'ready',
    note: 'uses your glut',
    veggie: true,
  },
  {
    title: 'Roast tomato soup',
    minutes: 50,
    serves: 4,
    uses: [{ art: 'tomato', name: 'tomatoes' }],
    readiness: 'ready',
    veggie: true,
  },
  {
    title: 'Runner bean and tomato salad with feta',
    minutes: 20,
    serves: 2,
    uses: [
      { art: 'bean', name: 'runner beans' },
      { art: 'tomato', name: 'tomatoes' },
      { art: 'herb-soft', name: 'mint' },
    ],
    readiness: 'nearly',
    missing: ['lemon', 'feta'],
    veggie: true,
  },
  {
    title: 'Chard and beetroot gratin',
    minutes: 70,
    serves: 4,
    uses: [
      { art: 'chard', name: 'chard' },
      { art: 'beetroot', name: 'beetroot' },
    ],
    readiness: 'shop',
    missing: ['double cream', 'Gruyère', 'breadcrumbs'],
    veggie: true,
  },
  {
    title: 'Courgette, bacon and pea pasta',
    minutes: 25,
    serves: 2,
    uses: [{ art: 'courgette', name: 'courgettes' }],
    readiness: 'nearly',
    missing: ['smoked bacon'],
    veggie: false,
  },
]

type CookFilter = 'all' | 'ready' | 'veggie' | 'mine'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'ready', label: 'Ready to cook' },
  { value: 'veggie', label: 'Veggie' },
  { value: 'mine', label: 'Mine' },
] as const

interface MockDay {
  dayName: string
  dayNumber: number
  label: string
  today?: boolean
  past?: boolean
  meals: DayMeal[]
}

const WEEK: readonly MockDay[] = [
  {
    dayName: 'Monday',
    dayNumber: 5,
    label: 'Monday 5 October',
    past: true,
    meals: [{ id: 'm1', title: 'Courgette and mint fritters', cooked: true }],
  },
  {
    dayName: 'Tuesday',
    dayNumber: 6,
    label: 'Tuesday 6 October',
    past: true,
    meals: [{ id: 'm2', title: 'Roast tomato soup', cooked: true }],
  },
  {
    dayName: 'Wednesday',
    dayNumber: 7,
    label: 'Wednesday 7 October',
    today: true,
    meals: [{ id: 'm3', title: 'Runner bean and tomato salad with feta', cooked: false }],
  },
  { dayName: 'Thursday', dayNumber: 8, label: 'Thursday 8 October', meals: [] },
  {
    dayName: 'Friday',
    dayNumber: 9,
    label: 'Friday 9 October',
    meals: [
      { id: 'm4', title: 'Chard and beetroot gratin', cooked: false },
      { id: 'm5', title: 'Green salad', cooked: false },
    ],
  },
  { dayName: 'Saturday', dayNumber: 10, label: 'Saturday 10 October', meals: [] },
  { dayName: 'Sunday', dayNumber: 11, label: 'Sunday 11 October', meals: [] },
]

function Shell({ tab, children }: { tab: MainTabId; children: ReactNode }) {
  const [active, setActive] = useState<MainTabId>(tab)
  return (
    <>
      <AppHeader
        nav={<TabBar tabs={MAIN_TABS} active={active} onSelect={setActive} />}
        actions={<IconButton icon="settings" label="Settings" />}
      />
      <main>
        <Page>{children}</Page>
      </main>
    </>
  )
}

function PatchScreen() {
  const ready = PATCH.filter((crop) => crop.status === 'ready')
  const soon = PATCH.filter((crop) => crop.status === 'soon')
  return (
    <Shell tab="patch">
      <ScreenTitle action={<Button icon="plus" size="sm">Add</Button>}>
        What's ready?
      </ScreenTitle>
      <section className={styles.screenSection} aria-labelledby="ready-now">
        <h2 id="ready-now" className={styles.groupHeading}>
          Ready now
        </h2>
        <ul role="list" className={styles.tileGrid}>
          {ready.map((crop) => (
            <li key={crop.name}>
              <ProduceTile name={crop.name} art={crop.art} status={crop.status} glut={crop.glut} showStatus={false} />
            </li>
          ))}
        </ul>
      </section>
      <section className={styles.screenSection} aria-labelledby="coming-soon">
        <h2 id="coming-soon" className={styles.groupHeading}>
          Coming soon
        </h2>
        <ul role="list" className={styles.tileGrid}>
          {soon.map((crop) => (
            <li key={crop.name}>
              <ProduceTile name={crop.name} art={crop.art} status={crop.status} showStatus={false} />
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  )
}

function CookScreen() {
  const [filter, setFilter] = useState<CookFilter>('all')
  const shown = RECIPES.filter(
    (recipe) =>
      filter === 'all' ||
      (filter === 'ready' && recipe.readiness === 'ready') ||
      (filter === 'veggie' && recipe.veggie),
  )
  return (
    <Shell tab="cook">
      <ScreenTitle aside="best first">What to cook</ScreenTitle>
      <div className={styles.screenSection}>
        <SegmentedControl label="Show" options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      <ul role="list" className={`${styles.recipeList} ${styles.screenSection}`}>
        {shown.map((recipe) => (
          <li key={recipe.title}>
            <RecipeCard
              title={recipe.title}
              minutes={recipe.minutes}
              serves={recipe.serves}
              uses={recipe.uses}
              readiness={recipe.readiness}
              missing={recipe.missing}
              note={recipe.note}
            />
          </li>
        ))}
      </ul>
    </Shell>
  )
}

function WeekScreen({ withForm }: { withForm: boolean }) {
  const [view, setView] = useState<'week' | 'month'>('week')
  const [formOpen, setFormOpen] = useState(withForm)
  return (
    <Shell tab="week">
      <ScreenTitle aside="5 to 11 Oct">This week</ScreenTitle>
      <div className={styles.weekBar}>
        <IconButton icon="chevronLeft" label="Previous week" variant="secondary" />
        <SegmentedControl
          label="View"
          options={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
          value={view}
          onChange={setView}
        />
        <IconButton icon="chevronRight" label="Next week" variant="secondary" />
      </div>
      <Notice tone="info" className={styles.screenSection}>
        Two days are empty. Fill my week to plan them from what's ready.
      </Notice>
      <ul role="list" className={`${styles.dayList} ${styles.screenSection}`}>
        {WEEK.map((day) => (
          <li key={day.label}>
            <DayCard {...day} onSelectMeal={() => {}} onAddMeal={() => setFormOpen(true)} />
          </li>
        ))}
      </ul>
      <div className={styles.screenSection}>
        <Button fullWidth size="lg">
          Fill my week
        </Button>
      </div>
      <RecipeFormSheet open={formOpen} onClose={() => setFormOpen(false)} />
    </Shell>
  )
}

export function GalleryScreen({ screen, withForm }: { screen: MockScreen; withForm: boolean }) {
  if (screen === 'cook') return <CookScreen />
  if (screen === 'week') return <WeekScreen withForm={withForm} />
  return <PatchScreen />
}
