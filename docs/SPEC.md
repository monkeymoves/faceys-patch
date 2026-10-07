# Facey's Patch: spec

A meal planner for allotment holders and veg growers. You tell it what's ready
on the plot, it tells you what to cook this week, and what (if anything) you
need to buy.

## Principles

- **Simple and kind.** Each screen does one job. No dashboards, no metrics,
  no gamification. A tired gardener with muddy hands should manage it one-thumbed.
- **On-device, no account.** Everything is saved in the browser on the
  device (localStorage). No login, no backend, no API keys, no bills.
  Export/import a backup file to move phones.
- **Works offline and installs like an app** on Android and iPhone (PWA).
- **No third-party requests at runtime.** Fonts and art are bundled.

## Vocabulary

| Word | Meaning |
| --- | --- |
| Patch | What you've grown that's ready now or ready soon (`HarvestItem`). |
| Larder | What's in the cupboard and fridge (`AppState.larder`). |
| Glut | "Loads of it." A patch item the planner should prioritise using up. |
| Cook | The recipe suggestions screen. |
| Week | The calendar: which recipe on which day. |
| Shop | The shopping list derived from the week's plan. |
| Assumed | Salt, pepper, water. Always available, never on a list. |

## Screens (bottom tab bar: Patch, Larder, Cook, Week, Shop)

1. **Patch**: grid of illustrated tiles for what's ready, with "Ready now" and
   "Coming soon" groups. Tap a tile to change status, toggle glut, or remove.
   "Add" opens a picker: search box, then "In season this month" (from
   `harvestMonths`), then everything growable A to Z. Empty state invites you
   to add what's ready, with in-season suggestions.
2. **Larder**: ingredients grouped by aisle, toggle on/off. Search to add
   anything. "Add the usual suspects" fills a sensible starter set
   (`STARTER_LARDER` in src/data).
3. **Cook**: recipes that use at least one thing from the patch, best first.
   Each card shows the patch veg it uses (little drawings) and a readiness
   badge: "Ready to cook" or "Need: lemon, feta". Filters: All, Ready to cook,
   Veggie, Mine. Recipe detail shows ingredients split into From the patch / In
   the larder / To buy, then the method, then "Add to week" (pick a day).
   **My recipes**: "Write a recipe" opens a form: title, short note
   (optional), minutes, serves, course, ingredients (search the list, give an
   amount, mark optional; "Not on the list?" adds a new ingredient with a name,
   aisle and "I grow this"), and the method as one step per line. Your own
   recipes can be edited and deleted (deleting also removes it from the week,
   after a confirm). A built-in recipe has "Make my own version", which opens
   the form pre-filled as a new recipe of yours.
4. **Week**: a week of day cards (Monday first) with prev/next week and a
   "This week" jump. Each day lists its meals; tap to view, mark cooked, or
   remove; "+" adds a meal from the matching list. "Fill my week" auto-plans
   the empty days from today onwards. A month view toggle shows a month grid
   with a mark on planned days; tapping a day jumps to that week.
5. **Shop**: everything the week's planned recipes need that you don't have,
   grouped by aisle, each showing which recipes need it. Tick items off.
   "Put ticked in the larder" moves them into the larder. "Share list" uses
   the Web Share API, falling back to copy-to-clipboard.

Settings (header button): export backup, import backup (with confirm),
start afresh (with confirm), and a plain note that data stays on this device.

## Domain rules (src/domain, pure functions, no React)

### Having an ingredient

You "have" an ingredient if it is in the harvest (any status), in the
larder, or `assumed`.

### Matching (`matchRecipes`)

For each recipe:

- `fromPatch`: ingredients (required or optional) that are in the harvest.
  Recipes with an empty `fromPatch` are excluded from results.
- `fromLarder`: ingredients (required or optional) in the larder that are not
  already in `fromPatch`.
- `missing`: required, non-assumed ingredients you don't have.
- `readiness`: `ready` if nothing missing, `nearly` if 1 or 2, `shop` if 3+.
- `score`, higher is better:
  - each `fromPatch` item: 3 if status `ready`, 1.5 if `soon`; doubled if glut;
    halved if the ingredient is optional in this recipe
  - minus 2 per missing ingredient
  - plus 3 if readiness is `ready`
- Sort by score descending, then title A to Z (deterministic).

### My recipes and ingredients

- User content is merged into the built-in catalogue before any matching,
  planning or shopping (`withMyContent(catalogue, state)`). Built-in ids win
  on a clash, though the `my-` prefix should make clashes impossible.
- User-written recipes follow the same rules as built-in ones. They appear in
  Cook suggestions only if they use something from the patch, like any other
  recipe, and always appear under the Mine filter.
- `diet` is derived on save, never asked for: no `meat-fish` ingredient means
  vegetarian; additionally no `dairy-eggs` ingredient and no honey means vegan.
- New ids are `my-` plus a slug of the title or name plus a short random
  suffix, created by the caller (the reducer stays pure).
- Deleting a recipe removes its planned meals. Ingredients added by the user
  are kept (they may be in the larder or other recipes).

### Planning (`planWeek`)

Fills the given empty dates, in date order, one meal per date:

- Candidates are matches, best score first. A recipe already planned in
  that week (or chosen earlier in this run) is not picked again.
- Only dinners are planned: candidates must have a course in
  `PLANNABLE_COURSES` (`main`, `soup`). Matching itself still returns every course.
- Variety: after a patch ingredient has been used by a chosen recipe this
  week, that ingredient's contribution to further candidates is halved for
  each prior use, unless it is a glut, where the first two uses are free.
- `soon` items: a recipe whose `fromPatch` includes a `soon` item is not placed
  on the first two dates of the run if any other candidate exists.
- Deterministic: same input, same output. Returns `Record<ISODate, RecipeId>`.
- Dates already holding a meal are never touched. If candidates run out,
  remaining dates are left empty.

### Shopping (`buildShoppingList`)

For every planned meal in the week (Monday to Sunday) that isn't marked
cooked: each required, non-assumed ingredient you don't have becomes a
`ShoppingItem`, merged by ingredient, with `forRecipes` in plan order. Sorted
by aisle (order of `AISLES`), then name. `ticked` comes from
`shoppingTicks[weekStart]`.

### Dates

Local calendar dates only, `YYYY-MM-DD`, built from `new Date(y, m, d)`
parts. Never `toISOString()` (it shifts across midnight in BST). Weeks start
Monday. Display uses `en-GB`.

### Storage

- Key `faceys-patch.v1` in localStorage, validated with zod on load.
- Corrupt or invalid data is never silently discarded: the raw string is
  copied to `faceys-patch.v1.corrupt.<timestamp>`, the app starts fresh,
  and the UI shows a visible notice.
- Unknown ingredient or recipe ids in saved state (e.g. a recipe later
  removed) are tolerated and skipped by selectors, never crash.
- User-written text is capped by the schema (title 80 chars, note 200, amount
  40, each step 600, at most 30 steps, 30 ingredients, 300 recipes, 300
  ingredients) so a hostile or broken backup can't bloat the app.
- Export is JSON: `{ app: 'faceys-patch', exportedAt, state }`. Import
  validates with the same schema, rejects files over 1 MB, and replaces state
  only after the user confirms.

## Architecture

```
src/
  domain/    pure TS: types, dates, matching, planning, shopping, state reducer, storage
  data/      reference data: ingredients, recipes, starter larder (+ integrity tests)
  art/       hand-drawn SVG illustrations as React components, keyed by ArtKey
  ui/        design-system components (Button, Chip, Sheet, TabBar...), no app logic
  styles/    tokens.css, global.css, fonts
  features/  one folder per screen: patch, larder, cook, week, shop, settings
  app/       App shell, store provider + hooks, switching between tabs
```

Dependency direction: `features -> ui, art, domain, data`; `ui -> art`;
`domain -> nothing but types` (data is passed in as a `Catalogue`). The
`domain` layer must never import React or `src/data`.

## Security and privacy

- No backend, no secrets, no analytics, no third-party scripts or fonts.
- Production CSP: `default-src 'self'` with only what's needed.
- Never inject raw HTML strings into the DOM. Render everything through JSX.
- Imported backup files are untrusted: size-capped, JSON-parsed in a try,
  zod-validated, never executed.
- `npm audit` clean at release.

## Out of scope for v1 (backlog)

Quantities/weights, sync between devices, sharing a single recipe with a
friend, sowing calendar, multiple meal slots per day (lunch/dinner),
notifications.
