# Facey's Patch

Meal planner PWA for allotment growers. React 19 + TypeScript (strict) + Vite 8,
tested with Vitest 5 + Testing Library. No backend: state lives in localStorage.

Read before working: `docs/SPEC.md` (product, domain rules, architecture) and
`docs/DESIGN.md` (visual direction). Shared types are in `src/domain/types.ts`;
treat that file as a contract and don't change it without being asked.

## Commands

- `npm run dev`: dev server
- `npm test`: all tests once. Scope while working: `npx vitest run src/domain`
- `npm run typecheck`, `npm run lint`, `npm run check` (all three)
- `npm run build`: production build into `dist/`

## Conventions

- Prettier-ish style: no semicolons, single quotes, 2-space indent, trailing commas.
- Named exports only (no default exports, except where a tool requires one).
- `src/domain` is pure TypeScript: no React, no DOM, no imports from `src/data`.
  Reference data reaches it as a `Catalogue` argument.
- Tests sit next to the code: `foo.ts` -> `foo.test.ts`. Test behaviour through
  public functions, not internals. UI tests query by role and accessible name.
- CSS: plain CSS Modules (`Thing.module.css`) using tokens from
  `src/styles/tokens.css`. No inline hex colours in components.
- Accessibility is not optional: real buttons, labels on inputs, visible focus,
  AA contrast, `prefers-reduced-motion` respected.
- Never inject raw HTML into the DOM. No new runtime dependencies without asking.
- Writing style for all copy, comments and docs: no em dashes or en dashes.
  Use commas, colons, brackets or a new sentence. British spelling.

## App layer (src/app), for building screens

- `useStore()` from `src/app/useStore`: `{ state, dispatch, catalogue, problem, dismissProblem }`.
  `catalogue` already includes the person's own recipes and ingredients. Always use it,
  never `CATALOGUE` from src/data directly, so their recipes behave like built-in ones.
- `useSupplies()` / `useMatches()` from `src/app/hooks`: memoised inputs for the domain and
  the ranked recipe matches.
- `useNavigation()` from `src/app/useNavigation`: `{ route, go }`. Routes live in the URL hash.
- `useViewedWeek()` from `src/app/useViewedWeek`: the week shown on Week and Shop (shared).
- `useToday()` from `src/app/useToday`, `makeMealId()` from `src/app/ids`.
- The reducer silently refuses changes that would break the saved-state schema, so validate
  user input first (`LIMITS`, `myRecipeSchema`, `myIngredientSchema` from src/domain).
- Contexts are split into a provider component file and a hook file (`store.tsx` +
  `useStore.ts`), because the lint rule for fast refresh forbids mixing them.
- Screen tests: `renderWithApp(<Screen />, { state })` from `src/test/render` seeds state
  through the real providers and returns `{ user, saved }` alongside the usual queries.
