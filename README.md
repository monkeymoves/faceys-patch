# Facey's Patch

A meal planner for allotment holders and veg growers. Tell it what's ready on
the plot and what's in the larder, and it suggests what to cook this week,
plans the days, and writes the shopping list for anything you're missing.

- **Patch**: what you've picked or will pick soon, including "loads of it" gluts.
- **Larder**: what's in the cupboard and fridge.
- **Cook**: 82 original recipes ranked by how much of your patch they use, plus your own.
- **Week**: a calendar of dinners. "Fill my week" plans the empty days for you.
- **Shop**: everything the week needs that you don't have, ready to share.

## Private by design

There's no account and no server. Everything is saved on your device, in your
browser. Nothing is sent anywhere: the app's security policy doesn't even
allow it to talk to other websites. Use Settings to download a backup file and
load it on another phone.

## Install it like an app

Open the site, then on iPhone tap **Share**, then **Add to Home Screen**; on
Android, open the Chrome menu and tap **Install app**. It works offline.

## Development

Needs Node 24.

```bash
npm install
npm run dev        # http://localhost:5173, with /?gallery and /?art review pages
npm run check      # typecheck, lint and all tests
npm run build      # production build into dist/
```

- [docs/SPEC.md](docs/SPEC.md): product, vocabulary and the domain rules (matching, planning, shopping, storage).
- [docs/DESIGN.md](docs/DESIGN.md): the visual direction, palette, type and drawing style.
- [CLAUDE.md](CLAUDE.md): code conventions and how the layers fit together.

The code is in layers: `src/domain` (pure TypeScript rules, no React), `src/data`
(ingredients and recipes), `src/art` (the drawings), `src/ui` (design-system
components), `src/features` (one folder per screen) and `src/app` (the shell and
state). Tests sit next to the code.

## Deploying

Every push to `main` runs the checks in GitHub Actions and, if they pass,
publishes to GitHub Pages. No servers, no bills.
