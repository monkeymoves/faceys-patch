import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithApp } from '../test/render'
import { useMatches } from './hooks'
import { useViewedWeek } from './useViewedWeek'

function MatchTitles() {
  const matches = useMatches()
  return (
    <ul>
      {matches.slice(0, 3).map((match) => (
        <li key={match.recipe.id}>{match.recipe.title}</li>
      ))}
    </ul>
  )
}

function WeekPicker() {
  const { weekStart, thisWeek, showWeekOf } = useViewedWeek()
  return (
    <>
      <p>Showing {weekStart}</p>
      <p>This week {thisWeek}</p>
      <button onClick={() => showWeekOf('2031-01-01')}>Jump</button>
    </>
  )
}

describe('useMatches', () => {
  it('suggests recipes from the real library for what is on the patch', () => {
    renderWithApp(<MatchTitles />, {
      state: { harvest: [{ ingredientId: 'tomato', status: 'ready', glut: true, addedOn: '2026-10-07' }] },
    })
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('suggests nothing when the patch is empty', () => {
    renderWithApp(<MatchTitles />)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})

describe('useViewedWeek', () => {
  it('starts on this week and snaps a chosen date to its Monday', async () => {
    const { user } = renderWithApp(<WeekPicker />)
    const thisWeek = screen.getByText(/^This week/).textContent?.replace('This week ', '')
    expect(screen.getByText(/^Showing/)).toHaveTextContent(`Showing ${thisWeek}`)

    await user.click(screen.getByRole('button', { name: 'Jump' }))
    expect(screen.getByText(/^Showing/)).toHaveTextContent('Showing 2030-12-30')
  })
})
