import type { CSSProperties } from 'react'

// Hand-drawn fruit for the market touches: one pen line, and a patch of colour printed
// slightly off the line, the way a stall's hand-painted sign is. Decoration only: they say
// nothing about what is in any drink. Each line is drawn in as it scrolls into view (Motion.tsx).
const ART = {
  strawberry: {
    colour: '#ff9aa9',
    fill: 'M32 58C20 50 11 38 13 27c1-7 9-9 19-8 10-1 18 1 19 8 2 11-7 23-19 31Z',
    lines: [
      'M32 58C20 50 11 38 13 27c1-7 9-9 19-8 10-1 18 1 19 8 2 11-7 23-19 31Z',
      'M32 19c-4-6-10-7-14-5 3 1 5 4 6 6M32 19c4-6 10-7 14-5-3 1-5 4-6 6M32 19c-1-4 0-8 1-11',
      'M24 30v2M32 28v2M40 30v2M28 38v2M36 38v2M32 46v2',
    ],
  },
  blueberry: {
    colour: '#93c8f6',
    fill: 'M11 40a14 14 0 1 0 28 0a14 14 0 1 0-28 0ZM38 21a9 9 0 1 0 18 0a9 9 0 1 0-18 0Z',
    lines: ['M11 40a14 14 0 1 0 28 0a14 14 0 1 0-28 0Z', 'M38 21a9 9 0 1 0 18 0a9 9 0 1 0-18 0Z', 'M21 35l4 3 4-3M25 38v-4M44 19l3 2 3-2'],
  },
  orange: {
    colour: '#ffb672',
    fill: 'M8 26h48c0 14-10 26-24 26S8 40 8 26Z',
    lines: ['M8 26h48c0 14-10 26-24 26S8 40 8 26Z', 'M14 31h36c-1 9-8 16-18 16s-17-7-18-16Z', 'M32 31v16M32 31l-11 12M32 31l11 12'],
  },
  lemon: {
    colour: '#ffe27a',
    fill: 'M8 32c6-12 18-18 30-16 6 1 10 4 13 8 3 0 5 2 6 4-1 3-3 4-6 5-3 8-12 15-24 15-8 0-15-3-19-16Z',
    lines: ['M8 32c6-12 18-18 30-16 6 1 10 4 13 8 3 0 5 2 6 4-1 3-3 4-6 5-3 8-12 15-24 15-8 0-15-3-19-16Z', 'M17 33c3-6 9-9 16-9'],
  },
  pineapple: {
    colour: '#ffd766',
    fill: 'M32 26c10 0 15 8 15 17s-5 17-15 17-15-8-15-17 5-17 15-17Z',
    lines: [
      'M32 26c10 0 15 8 15 17s-5 17-15 17-15-8-15-17 5-17 15-17Z',
      'M21 35l19 21M27 29l18 19M43 35L24 56M37 29L19 48',
      'M32 26c-2-8-8-12-13-13 4 3 6 7 6 11M32 26c2-8 8-12 13-13-4 3-6 7-6 11M32 26c-3-9-1-17 0-22 2 5 3 13 0 22',
    ],
  },
  banana: {
    colour: '#ffe58a',
    fill: 'M12 18c2 22 18 36 40 34 3 0 4-3 2-5-16 0-30-10-35-30-1-4-7-3-7 1Z',
    lines: ['M12 18c2 22 18 36 40 34 3 0 4-3 2-5-16 0-30-10-35-30-1-4-7-3-7 1Z', 'M16 22c4 15 14 24 29 27'],
  },
  cherry: {
    colour: '#ff9aa9',
    fill: 'M10 46a10 10 0 1 0 20 0a10 10 0 1 0-20 0ZM34 48a10 10 0 1 0 20 0a10 10 0 1 0-20 0Z',
    lines: ['M10 46a10 10 0 1 0 20 0a10 10 0 1 0-20 0Z', 'M34 48a10 10 0 1 0 20 0a10 10 0 1 0-20 0Z', 'M20 36C22 24 30 14 42 8M44 38c0-12-1-22-2-30', 'M42 8c6-3 13-1 16 4-6 3-12 2-16-4Z'],
  },
  watermelon: {
    colour: '#ff9aa9',
    fill: 'M8 20c16-8 32-8 48 0L32 58Z',
    lines: ['M8 20c16-8 32-8 48 0L32 58Z', 'M12 26c13-6 27-6 40 0', 'M26 34v3M38 34v3M32 43v3'],
  },
  apple: {
    colour: '#bfe391',
    fill: 'M32 22c-6-5-18-3-19 10-1 12 7 24 14 24 2 0 3-1 5-1s3 1 5 1c7 0 15-12 14-24-1-13-13-15-19-10Z',
    lines: ['M32 22c-6-5-18-3-19 10-1 12 7 24 14 24 2 0 3-1 5-1s3 1 5 1c7 0 15-12 14-24-1-13-13-15-19-10Z', 'M32 22c0-5 1-9 4-12', 'M36 14c4-5 10-5 13-3-2 5-8 7-13 3Z'],
  },
  mango: {
    colour: '#ffc95e',
    fill: 'M14 40c-2-14 8-26 22-27 10-1 17 5 17 15 0 14-12 26-25 26-8 0-13-5-14-14Z',
    lines: ['M14 40c-2-14 8-26 22-27 10-1 17 5 17 15 0 14-12 26-25 26-8 0-13-5-14-14Z', 'M38 13c2-6 8-9 14-8-1 6-7 10-14 8Z', 'M22 35c1-7 6-12 12-13'],
  },
  kiwi: {
    colour: '#c6e592',
    fill: 'M8 32a24 24 0 1 0 48 0a24 24 0 1 0-48 0Z',
    lines: ['M8 32a24 24 0 1 0 48 0a24 24 0 1 0-48 0Z', 'M25 32a7 7 0 1 0 14 0a7 7 0 1 0-14 0Z', 'M32 19v3M32 42v3M19 32h3M42 32h3M23 23l2 2M39 39l2 2M41 23l-2 2M25 39l-2 2'],
  },
} as const

export type DoodleName = keyof typeof ART

// `plain` leaves the colour out: line only, for the chalkboard and for tinted panels.
export function Doodle({ name, className = '', style, plain = false }: { name: DoodleName; className?: string; style?: CSSProperties; plain?: boolean }) {
  const art = ART[name]
  return (
    <svg className={`doodle ${className}`} style={style} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {!plain && <path className="doodle__fill" d={art.fill} fill={art.colour} transform="translate(3 2.5)" />}
      {art.lines.map((d) => (
        <path key={d} d={d} pathLength={1} />
      ))}
    </svg>
  )
}

// The fruit laid out on the stall's table, left to right.
export const STALL: DoodleName[] = ['pineapple', 'strawberry', 'orange', 'blueberry', 'mango', 'cherry', 'lemon', 'watermelon', 'apple', 'banana', 'kiwi']
