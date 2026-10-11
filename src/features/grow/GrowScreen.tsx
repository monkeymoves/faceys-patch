import { useEffect, useId, useRef, useState, type Ref } from 'react'
import { useNavigation } from '../../app/useNavigation'
import { useStore } from '../../app/useStore'
import { useToday } from '../../app/useToday'
import { Art } from '../../art/Art'
import {
  formatMonthLabel,
  formatMonths,
  groupJobsByKind,
  hiddenJobs,
  jobsForMonth,
  monthKey,
  monthKeyOf,
  monthName,
  monthRefOf,
  shiftMonth,
  sowingForMonth,
  type CropActivity,
  type IngredientId,
  type JobsInput,
  type JobView,
  type MonthRef,
  type MyJob,
} from '../../domain'
import { Announcer } from '../../ui/Announcer'
import { Button } from '../../ui/Button'
import { Checkbox } from '../../ui/Checkbox'
import { cx } from '../../ui/cx'
import { EmptyState } from '../../ui/EmptyState'
import { Icon } from '../../ui/icons'
import { IconButton } from '../../ui/IconButton'
import { Notice, type NoticeTone } from '../../ui/Notice'
import { Page } from '../../ui/Page'
import { PeriodNav } from '../../ui/PeriodNav'
import { ScreenTitle } from '../../ui/ScreenTitle'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { useAnnouncer } from '../../ui/useAnnouncer'
import { ACTIVITY_LABELS } from '../shared/growing'
import { CropCalendar } from './CropCalendar'
import { CropGuideSheet, type GuideTarget } from './CropGuideSheet'
import { jobHint, jobsLeftText, KIND_ICONS, KIND_LABELS, putAsideText } from './growCopy'
import { JobFormSheet, type JobFormRequest } from './JobFormSheet'
import { JobSheet } from './JobSheet'
import styles from './Grow.module.css'

type View = 'month' | 'crops'

const VIEWS = [
  { value: 'month', label: 'This month' },
  { value: 'crops', label: 'All crops' },
] as const

const SOWING: readonly Exclude<CropActivity, 'harvest'>[] = ['sowIndoors', 'sowOutdoors', 'plantOut']

interface Message {
  tone: NoticeTone
  text: string
  undo?: () => void
}

/** What a saved job's notice says, including when it will turn up if not in the month on show. */
function savedText(job: MyJob, shownNow: boolean): string {
  const title = `Saved "${job.title}".`
  if (shownNow) return title
  if (job.on) return `${title} It's down for ${monthName(monthRefOf(job.on).month)}.`
  const months = formatMonths(job.months)
  return `${title} It comes round ${months === 'All year' ? 'every month' : `every ${months}`}.`
}

/** "On the plot": what to sow and plant this month, the jobs to do, and every crop's year. */
export function GrowScreen() {
  const { state, dispatch, catalogue, almanac } = useStore()
  const { route, go } = useNavigation()
  const today = useToday()
  const thisMonth = monthRefOf(today)
  const [month, setMonth] = useState<MonthRef>(thisMonth)
  const [view, setView] = useState<View>('month')
  // `#/grow?crop=tomato`, from a tile on the Patch, opens that crop's guide.
  const routeCrop = route.tab === 'grow' ? route.crop : undefined
  const [guide, setGuide] = useState<GuideTarget | null>(routeCrop ? { id: routeCrop } : null)
  const [seenRouteCrop, setSeenRouteCrop] = useState(routeCrop)
  const [openJobId, setOpenJobId] = useState<string | null>(null)
  const [form, setForm] = useState<JobFormRequest | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  // Brought-forward one-offs ticked on this visit stay listed, so a row doesn't vanish under the thumb.
  const [kept, setKept] = useState<ReadonlySet<string>>(() => new Set())
  const [announcement, announce] = useAnnouncer()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const undoButton = useRef<HTMLButtonElement>(null)
  const putAsideSummary = useRef<HTMLElement>(null)
  const aboutButtons = useRef(new Map<string, HTMLButtonElement>())
  const focusAfterRender = useRef<(() => void) | null>(null)

  useEffect(() => {
    const focus = focusAfterRender.current
    focusAfterRender.current = null
    focus?.()
  })

  // The address changed under us (another tile on the Patch): open the new crop.
  if (routeCrop !== seenRouteCrop) {
    setSeenRouteCrop(routeCrop)
    if (routeCrop) setGuide({ id: routeCrop })
  }

  const input: JobsInput = { almanac, catalogue, state, month, today, keep: kept }
  const jobs = jobsForMonth(input)
  const broughtForward = jobs.filter((job) => job.broughtForward)
  const groups = groupJobsByKind(jobs)
  const toDo = jobs.filter((job) => !job.done).length
  const sowing = sowingForMonth(month.month, almanac, catalogue)
  const anySowing = SOWING.some((activity) => sowing[activity].length > 0)
  const putAside = hiddenJobs(almanac, state)
  const onThisMonth = month.year === thisMonth.year && month.month === thisMonth.month
  const label = formatMonthLabel(month.year, month.month)
  const name = monthName(month.month)

  const openJob = jobs.find((job) => job.id === openJobId) ?? null
  const openJobCrop = cropFor(openJob)

  /** The one crop a built-in job is about, when it names exactly one the catalogue knows. */
  function cropFor(job: JobView | null): { id: IngredientId; name: string } | undefined {
    if (!job || job.mine) return undefined
    const ids = almanac.jobs.find((candidate) => candidate.id === job.id)?.crops ?? []
    const crop = ids.length === 1 ? catalogue.ingredients.get(ids[0] ?? '') : undefined
    return crop && { id: crop.id, name: crop.name }
  }

  /** Where to land once something that had focus has gone: the job's About button, else the top. */
  function focusJobOrTop(jobId: string) {
    focusAfterRender.current = () => (aboutButtons.current.get(jobId) ?? headingRef.current)?.focus()
  }

  const registerAbout = (id: string, node: HTMLButtonElement | null) => {
    if (node) aboutButtons.current.set(id, node)
    else aboutButtons.current.delete(id)
  }

  function say(next: Message) {
    setMessage(next)
    announce(next.text)
  }

  function showMonth(next: MonthRef) {
    setMonth(next)
    setMessage(null)
    setKept(new Set())
    announce(formatMonthLabel(next.year, next.month))
  }

  function closeGuide() {
    setGuide(null)
    // Swap the address rather than add to history, or Back would open the guide again.
    if (routeCrop) go({ tab: 'grow' }, { replace: true })
  }

  function toggleDone(job: JobView) {
    dispatch({ type: 'jobs/toggleDone', jobId: job.id, month: job.doneKey })
    if (job.broughtForward) setKept((current) => new Set(current).add(job.id))
  }

  function putJobAside(job: JobView) {
    setOpenJobId(null)
    dispatch({ type: 'jobs/hide', jobId: job.id })
    say({
      tone: 'success',
      text: putAsideText(job.title),
      undo: () => {
        dispatch({ type: 'jobs/unhide', jobId: job.id })
        setMessage(null)
        announce(`Brought "${job.title}" back.`)
        focusJobOrTop(job.id)
      },
    })
    // The row it came from has gone, so land on Undo, the likeliest next move.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    focusAfterRender.current = () => undoButton.current?.focus()
  }

  function bringBack(job: { id: string; title: string }) {
    dispatch({ type: 'jobs/unhide', jobId: job.id })
    announce(`Brought "${job.title}" back.`)
    // Its row goes (and the whole list, if it was the last): stay on the disclosure, or go to the job itself.
    focusAfterRender.current = () =>
      (putAsideSummary.current ?? aboutButtons.current.get(job.id) ?? headingRef.current)?.focus()
  }

  function dismissMessage() {
    setMessage(null)
    headingRef.current?.focus()
  }

  return (
    <Page>
      <ScreenTitle
        ref={headingRef}
        action={<SegmentedControl label="View" options={VIEWS} value={view} onChange={setView} />}
      >
        On the plot
      </ScreenTitle>
      <Announcer message={announcement} />

      {message && (
        <Notice
          tone={message.tone}
          live={false}
          className={styles.message}
          action={
            message.undo && (
              <Button ref={undoButton} size="sm" variant="secondary" onClick={message.undo}>
                Undo
              </Button>
            )
          }
          onDismiss={dismissMessage}
        >
          {message.text}
        </Notice>
      )}

      {view === 'crops' ? (
        <div className={styles.calendarWrap}>
          <CropCalendar month={thisMonth.month} onOpen={(id) => setGuide({ id })} />
        </div>
      ) : (
        <>
          <PeriodNav
            className={styles.bar}
            label={label}
            previousLabel="Previous month"
            nextLabel="Next month"
            onPrevious={() => showMonth(shiftMonth(month, -1))}
            onNext={() => showMonth(shiftMonth(month, 1))}
            jump={onThisMonth ? undefined : { label: 'Back to this month', onClick: () => showMonth(thisMonth) }}
          />

          <Sowing
            month={name}
            sowing={sowing}
            anySowing={anySowing}
            onOpen={(id, activity) => setGuide({ id, activity })}
          />

          <Jobs
            month={name}
            jobs={jobs}
            broughtForward={broughtForward}
            groups={groups}
            toDo={toDo}
            onToggle={toggleDone}
            onAbout={(job) => setOpenJobId(job.id)}
            registerAbout={registerAbout}
            onAdd={() => setForm({ mode: 'new', month: month.month })}
          />

          {putAside.length > 0 && <PutAside ref={putAsideSummary} jobs={putAside} onBringBack={bringBack} />}
        </>
      )}

      <CropGuideSheet
        target={guide}
        month={view === 'crops' ? thisMonth.month : month.month}
        onClose={closeGuide}
        onAddJob={(prefill) => {
          closeGuide()
          setForm({ mode: 'new', month: month.month, prefill })
        }}
      />
      <JobSheet
        job={openJob}
        crop={openJobCrop}
        onClose={() => setOpenJobId(null)}
        onEdit={(job) => {
          setOpenJobId(null)
          setForm({ mode: 'edit', job })
        }}
        onDeleted={(job) => {
          setOpenJobId(null)
          say({ tone: 'success', text: `Deleted "${job.title}".` })
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          focusAfterRender.current = () => headingRef.current?.focus()
        }}
        onPutAside={putJobAside}
        onGuide={(id) => {
          setOpenJobId(null)
          setGuide({ id })
        }}
      />
      <JobFormSheet
        request={form}
        onClose={() => setForm(null)}
        onSaved={(job, mode) => {
          setForm(null)
          const shownNow = job.on ? monthKeyOf(job.on) === monthKey(month) : job.months.includes(month.month)
          say({ tone: 'success', text: savedText(job, shownNow) })
          // Editing started from the job's sheet, which has closed: carry on from its row.
          if (mode === 'edit') focusJobOrTop(job.id)
        }}
      />
    </Page>
  )
}

interface SowingProps {
  month: string
  sowing: ReturnType<typeof sowingForMonth>
  anySowing: boolean
  onOpen: (id: IngredientId, activity: CropActivity) => void
}

/** What to start this month, as chips with a drawing each. Tap one for its guide. */
function Sowing({ month, sowing, anySowing, onOpen }: SowingProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h2 id={headingId} className={styles.sectionHeading}>
        Sow and plant in {month}
      </h2>
      {anySowing ? (
        <>
          {SOWING.map((activity) =>
            sowing[activity].length > 0 ? (
              <div key={activity} className={styles.activity}>
                <h3 className={styles.activityHeading}>
                  <span className={cx(styles.swatch, styles[activity])} aria-hidden="true" />
                  {ACTIVITY_LABELS[activity]}
                </h3>
                <ul role="list" className={styles.cropChips}>
                  {sowing[activity].map((crop) => (
                    <li key={crop.id}>
                      <button type="button" className={styles.cropChip} onClick={() => onOpen(crop.id, activity)}>
                        <Art name={crop.art ?? 'seedling'} size={28} className={styles.chipArt} />
                        {crop.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          <p className={styles.groupNote}>
            Dates suit the middle of the UK. Further north, sow two or three weeks later in spring and a little
            earlier in autumn.
          </p>
        </>
      ) : (
        <p className={styles.groupNote}>Nothing to sow or plant this month. A good time to tidy, mulch and plan.</p>
      )}
    </section>
  )
}

interface JobListProps {
  jobs: readonly JobView[]
  onToggle: (job: JobView) => void
  onAbout: (job: JobView) => void
  registerAbout: (id: string, node: HTMLButtonElement | null) => void
}

interface JobsProps extends JobListProps {
  month: string
  broughtForward: readonly JobView[]
  groups: ReturnType<typeof groupJobsByKind>
  toDo: number
  onAdd: () => void
}

function Jobs({ month, jobs, broughtForward, groups, toDo, onAdd, ...rowProps }: JobsProps) {
  const headingId = useId()
  const earlierId = useId()
  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 id={headingId} className={styles.sectionHeading}>
          Jobs in {month}
        </h2>
        <p className={styles.count}>{jobsLeftText(toDo, jobs.length)}</p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          art={<Art name="seedling" size={80} />}
          title="A quiet month"
          headingLevel={3}
          action={
            <Button icon="plus" onClick={onAdd}>
              Add a job
            </Button>
          }
        >
          Nothing on the list. Add your own jobs and they'll come round every year.
        </EmptyState>
      ) : (
        <>
          {broughtForward.length > 0 && (
            <section aria-labelledby={earlierId} className={styles.kindGroup}>
              <h3 id={earlierId} className={cx(styles.kindHeading, styles.overdueHeading)}>
                <Icon name="alert" size={22} className={styles.kindIcon} />
                Still to do from earlier
              </h3>
              <JobList jobs={broughtForward} {...rowProps} />
            </section>
          )}
          {groups.map((group) => (
            <KindGroup key={group.kind} group={group} {...rowProps} />
          ))}
          <div className={styles.addJob}>
            <Button variant="secondary" icon="plus" onClick={onAdd}>
              Add a job of your own
            </Button>
          </div>
        </>
      )}
    </section>
  )
}

function KindGroup({ group, ...rowProps }: Omit<JobListProps, 'jobs'> & { group: ReturnType<typeof groupJobsByKind>[number] }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={styles.kindGroup}>
      <h3 id={headingId} className={styles.kindHeading}>
        <Icon name={KIND_ICONS[group.kind]} size={22} className={styles.kindIcon} />
        {KIND_LABELS[group.kind]}
      </h3>
      <JobList jobs={group.jobs} {...rowProps} />
    </section>
  )
}

function JobList({ jobs, onToggle, onAbout, registerAbout }: JobListProps) {
  return (
    <ul role="list" className={styles.jobs}>
      {jobs.map((job) => (
        <li key={job.id} className={styles.jobRow}>
          <Checkbox
            label={job.title}
            hint={jobHint(job)}
            checked={job.done}
            strike
            onCheckedChange={() => onToggle(job)}
            className={styles.jobCheck}
          />
          <IconButton
            ref={(node) => registerAbout(job.id, node)}
            icon="info"
            label={`About ${job.title}`}
            onClick={() => onAbout(job)}
            className={styles.about}
          />
        </li>
      ))}
    </ul>
  )
}

interface PutAsideProps {
  jobs: readonly { id: string; title: string }[]
  onBringBack: (job: { id: string; title: string }) => void
  /** The disclosure's summary, so focus can stay on it when a row goes. */
  ref?: Ref<HTMLElement>
}

/** Built-in jobs put aside as "not for my plot", with a way back. */
function PutAside({ jobs, onBringBack, ref }: PutAsideProps) {
  return (
    <details className={styles.details}>
      <summary ref={ref} className={styles.summary}>
        <span>Jobs put aside ({jobs.length})</span>
        <Icon name="chevronRight" size={20} className={styles.chevron} />
      </summary>
      <ul role="list" className={styles.asideList}>
        {jobs.map((job) => (
          <li key={job.id} className={styles.asideRow}>
            <span className={styles.asideTitle}>{job.title}</span>
            <Button size="sm" variant="ghost" onClick={() => onBringBack(job)}>
              Bring back
            </Button>
          </li>
        ))}
      </ul>
    </details>
  )
}
