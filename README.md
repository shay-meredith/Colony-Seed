# Colony Seed

A phone-first browser game about preparing a planetary system for colonists. You direct a crew of AI robots sent ahead of human colonists. Your job is to explore the system, build up an economy, and get the colony ready before the colonist ship arrives. **The arrival is the timer.** If housing, food, jobs, safety, and leisure aren't ready when it lands, you lose.

The pace is slow and decision-driven, in the spirit of Tropico and Paradox games. Time runs in pauseable realtime. The look is utilitarian early-Halo UNSC, at the system scale of Sins of a Solar Empire.

> **Design source of truth:** [`docs/DESIGN_CONTEXT.md`](docs/DESIGN_CONTEXT.md). Read it before making gameplay or UI changes.

**Status:** Slice A (scaffold). The navigation shell, time controls, and HUD work. Gameplay is stubbed.

## Play

When GitHub Pages is enabled (see below), the game is live at **https://shay-meredith.github.io/Colony-Seed/**. On iPhone, open it in Safari and use **Share → Add to Home Screen** to install it as an app.

## Run locally

Requires Node 20.19+ or 22+.

```bash
npm install
npm run dev        # http://localhost:5173/Colony-Seed/
```

`npm run dev` prints a LAN URL as well, so you can open it on your phone while it's on the same Wi-Fi.

| Script | What it does |
| --- | --- |
| `npm run dev` | Starts the Vite dev server with hot reload |
| `npm run build` | Typechecks, then builds the static site into `dist/` |
| `npm run preview` | Serves the production build at `http://localhost:4173/Colony-Seed/`. The service worker is only active here, not in dev. |
| `npm test` | Runs the unit tests (Vitest) |
| `npm run typecheck` | Runs `tsc --noEmit` |
| `npm run icons` | Regenerates the placeholder PNG icons in `public/icons/` |

## GitHub Pages

- The workflow `.github/workflows/pages.yml` runs tests and builds every PR. On each push to `main`, it builds and deploys `dist/` to Pages.
- **One-time setup (repo owner):** in the repo, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. The first deploy runs on the next push to `main`, or you can trigger it from **Actions → Build & deploy to GitHub Pages → Run workflow**.
- The Vite `base` is `/Colony-Seed/` (case-sensitive, matching the repo name) in every mode, so local URLs match production.
- Routing uses the URL hash (`#/body/verdance`), so deep links and refreshes work on Pages without server rewrites.
- No custom domain is configured. If one is added later, change `base` in `vite.config.ts` to `/`.

## Tech choices

The game is plain **Vite + TypeScript** with direct DOM and SVG rendering, and no UI framework. The UI is mostly panels and SVG art, and a framework would add bundle size and churn without much benefit at this stage (the whole app is about 11 KB of gzipped JS). Simulation logic is kept free of DOM code and unit tested. The rationale for each choice is in [design context, section 13](docs/DESIGN_CONTEXT.md#13-platform-and-tech-agent-proposed-2026-10-28).

```
src/
  app/        context (stores + clock), hash router, route table, shell frame, events
  core/       tiny DOM helper, observable store, seeded RNG
  sim/        SimClock (pauseable realtime), rAF driver with hard-pause, time formatting
  game/       resource + readiness definitions, game state, UI state
  data/       placeholder star system
  ui/         HUD, time bar, dock, icons, shared components, procedural body art
  screens/    systemMap (home), body, explore, build, bots, policy, menu
  styles/     tokens.css (aesthetic), base, components, screens
public/       manifest, service worker, icons
docs/         DESIGN_CONTEXT.md
```

## Screens (Slice A)

| Route | Screen |
| --- | --- |
| `#/` | **System map (home).** Tap a planet to see it and its moons and stations, plus colony readiness. |
| `#/body/:id` | **Body viewer.** Procedural portrait, stats, a growth preview, and switching between bodies in the same orbit. |
| `#/explore` | Exploration through survey directives and an event log (stub) |
| `#/build` | Building shop and active buildings (stub) |
| `#/bots` | Bot pip workforce and assignments (stub) |
| `#/policy` | Standing orders (stub; policy depth is still an open question) |
| `#/menu` | Settings (auto-pause toggle, test event), game actions (stub), about |

## Slice plan

The game is built in small, credit-aware slices. The owner reviews usage between slices.

- **A: Scaffold** (this): PWA shell, navigation, time-control stub, aesthetic tokens, design doc.
- **B: Loop**: the playable core loop, with resources ticking, bot pips, building, exploration events, readiness, and an arrival win/fail.
- **C: Polish**: art, game feel, balance, offline precaching, onboarding.
