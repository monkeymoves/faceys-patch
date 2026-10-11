import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ALMANAC, CATALOGUE, makeMyJob } from '../../domain/test-fixtures'
import { announced, shown } from '../../test/live'
import { renderWithApp } from '../../test/render'
import { GrowScreen } from './GrowScreen'

type Options = Parameters<typeof renderWithApp>[1]

/** The screen with the small fixture almanac and catalogue, so tests don't move when the real data is edited. */
const renderGrow = (options: Options = {}) =>
  renderWithApp(<GrowScreen />, { almanac: ALMANAC, builtIn: CATALOGUE, ...options })

describe('GrowScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 7, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
    window.location.hash = ''
  })

  describe('this month', () => {
    it('shows the month, what to sow and plant, and the jobs grouped by kind', async () => {
      const { user } = renderGrow()
      expect(screen.getByRole('heading', { name: 'On the plot', level: 1 })).toBeInTheDocument()
      expect(shown('October 2026')).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Sow and plant in October' })).toHaveTextContent(
        'Nothing to sow or plant this month.',
      )

      const jobs = screen.getByRole('region', { name: 'Jobs in October' })
      expect(within(jobs).getByText('3 of 3 still to do')).toBeInTheDocument()
      expect(within(jobs).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
        'Protect',
        'Harvest and store',
        'Prepare',
      ])
      expect(within(jobs).getByRole('checkbox', { name: 'Mulch empty beds for winter' })).toHaveAccessibleDescription(
        'A thick layer of compost keeps the worms busy and the weeds down.',
      )

      await user.click(screen.getByRole('button', { name: 'Next month' }))
      expect(shown('November 2026')).toBeInTheDocument()
      expect(announced()).toContain('November 2026')
      await user.click(screen.getByRole('button', { name: 'Back to this month' }))
      expect(shown('October 2026')).toBeInTheDocument()
    })

    it('lists crops to sow under cover, sow outside and plant out, and opens a guide from one', async () => {
      const { user } = renderGrow()
      for (let i = 0; i < 7; i += 1) await user.click(screen.getByRole('button', { name: 'Next month' }))
      expect(shown('May 2027')).toBeInTheDocument()

      const sowing = screen.getByRole('region', { name: 'Sow and plant in May' })
      expect(within(sowing).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
        'Sow under cover',
        'Sow outside',
        'Plant',
      ])
      expect(within(sowing).getAllByRole('button').map((chip) => chip.textContent)).toEqual([
        'Courgettes',
        'Courgettes',
        'Courgettes',
        'Tomatoes',
      ])

      await user.click(within(sowing).getByRole('button', { name: 'Tomatoes' }))
      const sheet = screen.getByRole('dialog', { name: 'Tomatoes' })
      // The chart is decorative: the months are written out beside it.
      expect(within(sheet).queryByRole('img')).not.toBeInTheDocument()
      expect(
        within(sheet).getByText('Sow under cover February to April, plant May and June, harvest July to September.'),
      ).toBeInTheDocument()
      expect(within(sheet).getByRole('region', { name: 'How to grow it' })).toHaveTextContent('Pinch out side shoots.')

      // "Add a job" from a plant chip suggests a title.
      await user.click(within(sheet).getByRole('button', { name: 'Add a job about tomatoes' }))
      const form = screen.getByRole('dialog', { name: 'Add a job' })
      expect(within(form).getByRole('textbox', { name: 'Title' })).toHaveValue('Plant tomatoes')
      expect(within(form).getByRole('combobox', { name: 'What sort of job' })).toHaveValue('plant')
      expect(within(form).getByRole('button', { name: 'May' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('ticks a job off for this month only, and counts down', async () => {
      const { user, saved } = renderGrow({ state: { jobsDone: { '2025-10': ['mulch-beds'] } } })
      const box = screen.getByRole('checkbox', { name: 'Mulch empty beds for winter' })
      expect(box).not.toBeChecked()
      await user.click(box)
      expect(saved()?.jobsDone).toEqual({ '2025-10': ['mulch-beds'], '2026-10': ['mulch-beds'] })
      expect(screen.getByText('2 of 3 still to do')).toBeInTheDocument()
      await user.click(box)
      expect(saved()?.jobsDone).toEqual({ '2025-10': ['mulch-beds'] })
    })

    it('shows the whole note in a sheet, where a built-in job can be put aside and brought back', async () => {
      const { user, saved } = renderGrow()
      await user.click(screen.getByRole('button', { name: 'About Net brassicas against pigeons' }))
      const sheet = screen.getByRole('dialog', { name: 'Net brassicas against pigeons' })
      expect(within(sheet).getByText('Pigeons strip young plants overnight.')).toBeInTheDocument()
      expect(within(sheet).getByText(/Protect/)).toHaveTextContent('Every October to March')

      await user.click(within(sheet).getByRole('button', { name: 'Not for my plot' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(saved()?.hiddenJobs).toEqual(['net-brassicas'])
      expect(screen.queryByRole('checkbox', { name: 'Net brassicas against pigeons' })).not.toBeInTheDocument()
      expect(shown(/Put "Net brassicas against pigeons" aside/)).toBeInTheDocument()
      await waitFor(() => expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus())

      await user.click(screen.getByRole('button', { name: 'Undo' }))
      expect(saved()?.hiddenJobs).toEqual([])
      expect(screen.getByRole('checkbox', { name: 'Net brassicas against pigeons' })).toBeInTheDocument()
    })

    it('lists jobs put aside under a disclosure with a way back, and keeps focus nearby', async () => {
      const { user, saved } = renderGrow({ state: { hiddenJobs: ['check-stores', 'mulch-beds'] } })
      expect(screen.getByText('1 of 1 still to do')).toBeInTheDocument()
      await user.click(screen.getByText('Jobs put aside (2)'))
      // Listed in the almanac's order: mulching first.
      await user.click(screen.getAllByRole('button', { name: 'Bring back' })[0] as HTMLElement)
      expect(saved()?.hiddenJobs).toEqual(['check-stores'])
      expect(screen.getByRole('checkbox', { name: 'Mulch empty beds for winter' })).toBeInTheDocument()
      await waitFor(() => expect(screen.getByText('Jobs put aside (1)').closest('summary')).toHaveFocus())

      // The last one back takes the disclosure with it: carry on from the job itself.
      await user.click(screen.getByRole('button', { name: 'Bring back' }))
      expect(screen.queryByText(/Jobs put aside/)).not.toBeInTheDocument()
      await waitFor(() => expect(screen.getByRole('button', { name: 'About Check stored crops' })).toHaveFocus())
    })

    it('ticks a job off from its sheet too', async () => {
      const { user, saved } = renderGrow()
      await user.click(screen.getByRole('button', { name: 'About Mulch empty beds for winter' }))
      const sheet = screen.getByRole('dialog', { name: 'Mulch empty beds for winter' })
      await user.click(within(sheet).getByRole('checkbox', { name: 'Done this month' }))
      expect(saved()?.jobsDone).toEqual({ '2026-10': ['mulch-beds'] })
      expect(within(sheet).getByRole('checkbox', { name: 'Done this month' })).toBeChecked()
    })

    it('offers the growing guide from a job about one crop', async () => {
      const { user } = renderGrow({ state: { hiddenJobs: [] } })
      for (let i = 0; i < 3; i += 1) await user.click(screen.getByRole('button', { name: 'Next month' }))
      await user.click(screen.getByRole('button', { name: 'About Chit seed potatoes' }))
      await user.click(screen.getByRole('button', { name: 'How to grow potatoes' }))
      expect(screen.getByRole('dialog', { name: 'Potatoes' })).toHaveTextContent('Chit first.')
    })
  })

  describe('my own jobs', () => {
    it('adds a yearly job for the month on show', async () => {
      const { user, saved } = renderGrow()
      await user.click(screen.getByRole('button', { name: 'Add a job of your own' }))
      const form = screen.getByRole('dialog', { name: 'Add a job' })

      await user.type(within(form).getByRole('textbox', { name: 'Title' }), 'Net the strawberries')
      expect(within(form).getByRole('button', { name: 'October' })).toHaveAttribute('aria-pressed', 'true')
      await user.click(within(form).getByRole('button', { name: 'November' }))
      await user.type(within(form).getByRole('textbox', { name: /^Note/ }), 'Before the blackbirds do.')
      await user.click(within(form).getByRole('button', { name: 'Save job' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(saved()?.myJobs).toEqual([
        expect.objectContaining({ title: 'Net the strawberries', note: 'Before the blackbirds do.', kind: 'tend', months: [10, 11] }),
      ])
      expect(saved()?.myJobs[0]?.id).toMatch(/^my-net-the-strawberries-[a-z0-9]{5}$/)
      expect(shown('Saved "Net the strawberries".')).toBeInTheDocument()
      const tend = screen.getByRole('region', { name: 'Tend' })
      expect(within(tend).getByRole('checkbox', { name: 'Net the strawberries' })).toHaveAccessibleDescription(
        'Before the blackbirds do.',
      )
    })

    it('says where a job will turn up when it is not for the month on show', async () => {
      const { user } = renderGrow()
      await user.click(screen.getByRole('button', { name: 'Add a job of your own' }))
      const form = screen.getByRole('dialog', { name: 'Add a job' })
      await user.type(within(form).getByRole('textbox', { name: 'Title' }), 'Prune the apple tree')
      await user.click(within(form).getByRole('button', { name: 'October' }))
      await user.click(within(form).getByRole('button', { name: 'January' }))
      await user.click(within(form).getByRole('button', { name: 'February' }))
      await user.click(within(form).getByRole('button', { name: 'Save job' }))
      expect(shown('Saved "Prune the apple tree". It comes round every January and February.')).toBeInTheDocument()
    })

    it('adds a one-off job on a date', async () => {
      const { user, saved } = renderGrow()
      await user.click(screen.getByRole('button', { name: 'Add a job of your own' }))
      const form = screen.getByRole('dialog', { name: 'Add a job' })
      await user.type(within(form).getByRole('textbox', { name: 'Title' }), 'Collect manure from Dave')
      await user.click(within(form).getByRole('radio', { name: 'Just once' }))
      fireEvent.change(within(form).getByLabelText('Date'), { target: { value: '2026-10-24' } })
      await user.click(within(form).getByRole('button', { name: 'Save job' }))

      expect(saved()?.myJobs[0]).toMatchObject({ title: 'Collect manure from Dave', months: [], on: '2026-10-24' })
      expect(screen.getByRole('checkbox', { name: 'Collect manure from Dave' })).toHaveAccessibleDescription(
        'Saturday 24 October',
      )
    })

    it('points out what is missing before saving', async () => {
      const { user, saved } = renderGrow()
      await user.click(screen.getByRole('button', { name: 'Add a job of your own' }))
      const form = screen.getByRole('dialog', { name: 'Add a job' })
      await user.click(within(form).getByRole('button', { name: 'October' }))
      await user.click(within(form).getByRole('button', { name: 'Save job' }))

      const title = within(form).getByRole('textbox', { name: 'Title' })
      expect(title).toBeInvalid()
      expect(title).toHaveAccessibleDescription('Give it a title.')
      expect(title).toHaveFocus()
      expect(within(form).getByRole('button', { name: 'January' })).toHaveAccessibleDescription(
        'Pick at least one month.',
      )
      expect(saved()?.myJobs).toEqual([])

      // Fix the title and the months problem gets the focus next.
      await user.type(title, 'Something')
      await user.click(within(form).getByRole('button', { name: 'Save job' }))
      expect(within(form).getByRole('button', { name: 'January' })).toHaveFocus()
    })

    it('asks before throwing away a changed form', async () => {
      const { user } = renderGrow()
      await user.click(screen.getByRole('button', { name: 'Add a job of your own' }))
      await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Half a thought')
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      const confirm = screen.getByRole('alertdialog', { name: 'Throw away these changes?' })
      await user.click(within(confirm).getByRole('button', { name: 'Throw away' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('brings an undone one-off from an earlier month forward as still to do', () => {
      renderGrow({
        state: { myJobs: [makeMyJob('my-fence-a1b2c', 'Fix the fence', { kind: 'prepare', months: [], on: '2026-09-20' })] },
      })
      const late = screen.getByRole('region', { name: 'Still to do from earlier' })
      expect(within(late).getByRole('checkbox', { name: 'Fix the fence' })).toHaveAccessibleDescription(
        'Was due Sunday 20 September',
      )
      expect(screen.getByText('4 of 4 still to do')).toBeInTheDocument()
    })

    it('keeps a brought-forward job in view once ticked, under its own month', async () => {
      const { user, saved } = renderGrow({
        state: { myJobs: [makeMyJob('my-fence-a1b2c', 'Fix the fence', { kind: 'prepare', months: [], on: '2026-09-20' })] },
      })
      const box = screen.getByRole('checkbox', { name: 'Fix the fence' })
      await user.click(box)
      expect(saved()?.jobsDone).toEqual({ '2026-09': ['my-fence-a1b2c'] })
      expect(screen.getByRole('checkbox', { name: 'Fix the fence' })).toBeChecked()
      expect(screen.getByRole('region', { name: 'Still to do from earlier' })).toBeInTheDocument()
      expect(screen.getByText('3 of 4 still to do')).toBeInTheDocument()

      // Leaving the month and coming back, it has gone where it belongs.
      await user.click(screen.getByRole('button', { name: 'Next month' }))
      await user.click(screen.getByRole('button', { name: 'Back to this month' }))
      expect(screen.queryByRole('checkbox', { name: 'Fix the fence' })).not.toBeInTheDocument()
    })

    it('edits and deletes a job of mine from its sheet', async () => {
      const { user, saved } = renderGrow({
        state: { myJobs: [makeMyJob('my-shed-a1b2c', 'Tidy the shed', { kind: 'prepare', months: [10] })] },
      })
      await user.click(screen.getByRole('button', { name: 'About Tidy the shed' }))
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      const form = screen.getByRole('dialog', { name: 'Edit job' })
      const title = within(form).getByRole('textbox', { name: 'Title' })
      await user.clear(title)
      await user.type(title, 'Tidy the shed properly')
      await user.click(within(form).getByRole('button', { name: 'Save job' }))
      expect(saved()?.myJobs).toEqual([expect.objectContaining({ id: 'my-shed-a1b2c', title: 'Tidy the shed properly' })])
      // The Edit button that opened the form has gone with its sheet: carry on from the job's row.
      await waitFor(() => expect(screen.getByRole('button', { name: 'About Tidy the shed properly' })).toHaveFocus())

      await user.click(screen.getByRole('button', { name: 'About Tidy the shed properly' }))
      await user.click(screen.getByRole('button', { name: 'Delete this job' }))
      const confirm = screen.getByRole('alertdialog', { name: 'Delete this job?' })
      await user.click(within(confirm).getByRole('button', { name: 'Delete' }))
      expect(saved()?.myJobs).toEqual([])
      expect(shown('Deleted "Tidy the shed properly".')).toBeInTheDocument()
      expect(screen.queryByRole('checkbox', { name: 'Tidy the shed properly' })).not.toBeInTheDocument()
    })
  })

  describe('all crops', () => {
    it('lists every crop with its year, finds by name, and opens the guide', async () => {
      const { user } = renderGrow()
      await user.click(screen.getByRole('radio', { name: 'All crops' }))
      const names = screen.getAllByRole('button').map((b) => b.textContent ?? '')
      expect(names).toContain('Potatoes')
      expect(names).toContain('Tomatoes')

      await user.type(screen.getByRole('searchbox', { name: 'Find a crop' }), 'tom')
      await waitFor(() =>
        expect(screen.getAllByRole('img').map((img) => img.getAttribute('aria-label'))).toEqual([
          'Sow under cover: February to April. Plant: May and June. Harvest: July to September.',
        ]),
      )
      await waitFor(() => expect(announced()).toContain('1 crop found.'))

      await user.click(screen.getByRole('button', { name: 'Tomatoes' }))
      expect(screen.getByRole('dialog', { name: 'Tomatoes' })).toBeInTheDocument()
    })

    it('says when nothing matches', async () => {
      const { user } = renderGrow()
      await user.click(screen.getByRole('radio', { name: 'All crops' }))
      await user.type(screen.getByRole('searchbox', { name: 'Find a crop' }), 'zzz')
      await waitFor(() => expect(screen.getByText('No crop matches that.')).toBeInTheDocument())
    })
  })

  it('opens a crop guide straight from the address, as the Patch links to it, and clears the address on close', async () => {
    window.location.hash = '#/grow?crop=courgette'
    const { user } = renderGrow()
    const sheet = screen.getByRole('dialog', { name: 'Courgettes' })
    expect(within(sheet).getByText('Pick them small and often.')).toBeInTheDocument()

    await user.click(within(sheet).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(window.location.hash).toBe('#/grow')

    // The address changing under the screen opens the new crop.
    window.location.hash = '#/grow?crop=tomato'
    await screen.findByRole('dialog', { name: 'Tomatoes' })
  })
})
