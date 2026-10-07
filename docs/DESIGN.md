# Facey's Patch: design

## The idea: the shed notebook

It should feel like the notebook that lives in the allotment shed: warm paper,
pencil-and-ink drawings of veg, the odd scribbled note in the margin. Calm,
personal, a bit scruffy in a good way. Not a SaaS dashboard, not a recipe
magazine.

The hand-drawn quality is the seasoning, not the meal. Illustrations,
underlines and the odd handwritten note carry the character. Body text,
buttons and controls stay crisp, legible and boringly reliable.

## Anti-slop list (do not do these)

- No gradients, glassmorphism, glows, or sparkles.
- No drop shadows, except one soft shadow on the open sheet/dialog.
- No emoji anywhere in the UI. No generic icon sets (Lucide, Material, Heroicons).
  Every icon is drawn for this app in the same ink style as the veg.
- No purple, no teal-to-blue, no neon.
- No stat cards, KPIs, progress rings, percentages, "kg saved".
- No Inter, Roboto, Poppins, or system-ui as the visible face.
- No identical rounded-2xl cards with the same shadow repeated down the page.
- No marketing copy. Write like a friend at the next plot: short, plain, warm.

## Palette

UI chrome is mostly paper and ink with one green. Colour lives in the drawings.

| Token | Hex | Use |
| --- | --- | --- |
| `--paper` | `#F6F0E4` | page background |
| `--paper-2` | `#EDE4D3` | sunken areas, tab bar, inputs at rest |
| `--card` | `#FFFDF8` | raised surfaces |
| `--ink` | `#2B2420` | text, outlines in drawings |
| `--ink-2` | `#5F564D` | secondary text |
| `--line` | `#D9CDB8` | hairlines, borders |
| `--leaf` | `#3F6F35` | primary actions, active tab, "ready to cook" |
| `--leaf-wash` | `#E3EBD3` | ready badge fill, selected chips |
| `--tomato` | `#C8482B` | glut marker, "need to buy", destructive |
| `--tomato-wash` | `#F7DFD3` | |
| `--marigold` | `#E3A33A` | "coming soon", highlights, today marker |
| `--marigold-wash` | `#F8EACB` | |

All text must meet WCAG AA on its background. Light theme only for v1 (set
`color-scheme: light`), but keep every colour behind a token so a "night
shed" theme can be added later.

## Type

Self-hosted via Fontsource (already installed, never load from Google):

- **Fraunces** (`@fontsource-variable/fraunces/full.css`) for headings and the
  wordmark. Use `font-variation-settings: "SOFT" 100, "WONK" 1`, weight ~600 to
  700. It gives soft, slightly wonky, seed-packet serifs.
- **Atkinson Hyperlegible Next** (`@fontsource-variable/atkinson-hyperlegible-next`)
  for body and UI. Chosen for outdoor, glare and older-eye legibility. Base
  size 17px.
- **Caveat** (`@fontsource-variable/caveat`) for handwritten margin notes
  only ("loads!", "ready Sat", day names in the week view). At least 20px.
  At most one handwritten note per card. Never for anything you must read
  to operate the app.

Use `font-variant-numeric: tabular-nums` for dates in the calendar.

## Drawing style (veg, fruit, herbs, icons)

One consistent style across every illustration and icon:

- **Ink line**: `--ink` colour, stroke width 2.25 in a 64x64 viewBox (scale
  proportionally for 24x24 icons, about 1.75), round caps and joins, no fill
  on the line layer.
- **Hand-made wobble baked into the paths**: no perfect circles or straight
  machine lines. Curves slightly uneven, lines that don't quite close, the
  odd overshoot. Do not use a runtime SVG filter for wobble.
- **Flat fill underneath, slightly off-register**: the colour shape sits
  1 to 2 units down and right of the outline, like a cheap two-colour screen
  print. Fills are flat, no gradients. A few tiny detail strokes (a seam on
  a pod, dimples on a strawberry) are fine; no shading or hatching blocks.
- **Simple silhouettes**: a 6-year-old should name it. One veg per drawing,
  a sprig of leaves where it helps recognition (carrot tops, beet leaves).
- **Art palette** (fills only, in `src/art/palette.ts`): leaf green
  `#6E9A4F`, deep leaf `#3F6F35`, pale leaf `#A9C487`, tomato `#D9533A`,
  carrot `#E7792F`, squash `#E8913A`, marigold `#EDB33F`, corn `#F1CF5B`,
  beet `#8A2C49`, plum `#5E3B63`, berry `#A3324A`, potato `#C9A46E`,
  onion skin `#C98652`, garlic `#EFE6D3`, cabbage `#7FA08A`, chalk `#F7F2E8`.

Decorative extras in the same ink: a wobbly underline under screen titles,
a hand-drawn ring around the active tab icon, a hand-drawn tick for
checkboxes. Chips can use the uneven-radius trick
(`border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px`) sparingly.

## Layout

- Mobile first, one column, generous spacing, touch targets at least 44px.
- Content column max ~640px, centred on wide screens.
- Bottom tab bar on phones (Patch, Larder, Cook, Week, Shop), each with its
  own drawn icon: trowel, jar, pot, calendar page, basket. On wide screens
  (>= 900px) the same tabs sit in a slim top header beside the wordmark.
- Header: wordmark "Facey's Patch" on the left, settings button on the right.
- Sheets: bottom sheet on phones, centred dialog on wide screens, built on
  the native `<dialog>` element (focus trap and Escape for free).
- Motion: small and quick (150 to 200ms), and none at all under
  `prefers-reduced-motion`.

## Voice

Short, plain, friendly, British. "What's ready on the plot?", "Loads of it",
"Ready to cook", "You'll need: lemon, feta", "Nothing planned yet". Never
"Unlock", "Supercharge", "Effortless", "Journey".
