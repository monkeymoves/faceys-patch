import { FILL } from '../palette'
import { Fill, Ink } from './layers'
import type { Drawing, DrawingSet } from './types'

const herbSoft: Drawing = () => {
  const leaves = [
    'M30.6 47C26 51.4 15.4 50 12.6 41C17.6 35.6 27.6 38.6 30.6 47',
    'M31.4 45C34.6 38.6 45 36.6 51 40C47.4 47.6 37.6 49.4 31.4 45',
    'M31.6 33C26 36 17.6 32 16 22.4C22.6 21.4 29.6 25.6 31.6 33',
    'M32 30.6C34.6 24.6 42.4 21.4 48.6 24C46.4 31 38.4 33.4 32 30.6',
    'M32 22C28.4 18 28.6 12 32.2 7.6C36 12 36.2 18 32.6 22',
  ]
  return (
    <>
      <Fill>
        {leaves.map((d) => (
          <path key={d} fill={FILL.leaf} d={d} />
        ))}
      </Fill>
      <Ink>
        <path d="M30 60C31 50 31.6 38 32.2 22" />
        {leaves.map((d) => (
          <path key={d} d={d} />
        ))}
        <path d="M29.6 46.4C24.6 44 19.6 42.6 14.6 41.4M32.4 44.6C37.6 42.6 43 41.4 49 40.4M30.6 32.2C26 29 22 26 18 23.4M33 30C38 27.6 42.4 25.6 46.6 24.6" />
      </Ink>
    </>
  )
}

const herbWoody: Drawing = () => {
  const stem = 'M22 61C24 46 28 30 40 9'
  const needles = 'M22.9 55.1Q18.2 50.7 15.2 45M22.9 55.1Q29.4 52.1 34.7 47.3M23.9 50Q19.3 46.7 16.3 41.9M23.9 50Q29.9 48.3 35 44.6M25.1 44.7Q21 40.9 18.8 35.8M25.1 44.7Q30.9 42.5 35.5 38.4M26.6 39.3Q22.7 36.5 20.5 32.2M26.6 39.3Q31.9 38.6 36.4 35.9M28.5 33.6Q25.2 29.9 23.9 25.1M28.5 33.6Q33.9 33 38.6 30.2M30.7 27.8Q27.7 24.5 26.7 20.1M30.7 27.8Q35.6 27 39.7 24.2M33.2 22.2Q30.3 19.6 29.4 15.9M33.2 22.2Q37.4 22.6 41.2 20.8M36 16.4Q33.7 13.1 33.5 9M36 16.4Q40.5 16.3 44.3 14.2M40 9L42.3 5'
  const sprig = 'M22.5 57.4Q17.4 52.1 15.2 45Q15.3 43.3 16.3 41.9Q16.8 38.5 18.8 35.8Q19.2 33.8 20.5 32.2Q21.4 28.3 23.9 25.1Q24.7 22.3 26.7 20.1Q27.5 17.7 29.4 15.9Q30.6 12 33.5 9Q37.4 6 42.3 5Q44.4 9.4 44.3 14.2Q43.6 17.9 41.2 20.8Q40.8 22.7 39.7 24.2Q39.9 27.3 38.6 30.2Q38.2 33.3 36.4 35.9Q36.2 37.3 35.5 38.4Q36 41.6 35 44.6Q35.1 46 34.7 47.3Z'
  return (
    <>
      <Fill>
        <path fill={FILL.cabbage} d={sprig} />
        <path fill="none" stroke={FILL.potato} strokeWidth={3.4} strokeLinecap="round" d="M22 61C22.8 56 23.2 53 23.8 50" />
      </Fill>
      <Ink>
        <path d={stem} />
        <path d={needles} />
      </Ink>
    </>
  )
}

const seedling: Drawing = () => {
  const soil = 'M9.6 55.4C14 49 23 46.2 32 46.4C41 46.6 49.6 49.4 54.6 55C40 56.6 22 56.6 9.6 55.4'
  const left = 'M31.6 27.6C27.6 19 17 15.4 9.6 19.4C12 27.6 22.6 31.6 31.6 27.6'
  const right = 'M32.4 27C35.4 18 45 13.4 53.6 15.6C51.6 24.4 42.4 29.6 32.4 27'
  return (
    <>
      <Fill>
        <path fill={FILL.potato} d={soil} />
        <path fill={FILL.leaf} d={left} />
        <path fill={FILL.leaf} d={right} />
      </Fill>
      <Ink>
        <path d="M9.6 55.4C14 49 23 46.2 32 46.4C41 46.6 49.6 49.4 54.6 55" />
        <path d="M31.6 47C31.2 40 32.4 33 31.8 26.6" />
        <path d={left} />
        <path d={right} />
        <path d="M29.4 26.6C24 23.6 18 21.4 12.8 20.6M34.6 25.8C40 22.4 45.6 19 51 17" />
      </Ink>
    </>
  )
}

export const herbs = {
  'herb-soft': herbSoft,
  'herb-woody': herbWoody,
  seedling,
} satisfies DrawingSet
