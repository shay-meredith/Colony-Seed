# Colony Seed: Design Context

**Single source of truth for design decisions agreed with the owner, Shay Meredith.**
Future coding agents: read this before changing gameplay, UI structure, or look and feel.

- **Owner:** Shay Meredith
- **Repo:** https://github.com/shay-meredith/Colony-Seed
- **Live (once Pages is enabled):** https://shay-meredith.github.io/Colony-Seed/
- **Last updated:** 2026-10-28 (Slice A scaffold)

## How to use this file

1. **Locked** decisions need the owner's sign-off to change. If code and this file disagree, this file wins; fix the code or raise the conflict in your PR.
2. **Direction** items are preferred approaches that can change if they prove impractical. Each one lists its fallback.
3. **Open** items are not decided yet. Don't settle them on your own. Propose options in the PR description.
4. **Agent-proposed** items were picked by an agent to unblock work and are waiting for owner review. Changing them is cheap.
5. When a decision is made, add a dated entry to the [decision log](#16-decision-log) and update the relevant section.

| Tag | Meaning |
| --- | --- |
| `LOCKED` | Agreed with owner. Don't change without sign-off. |
| `DIRECTION` | Preferred approach with a named fallback. |
| `OPEN` | Undecided. Propose options, don't pick one. |
| `AGENT-PROPOSED` | Default chosen by an agent. Owner hasn't reviewed it yet. |

---

## 1. Elevator pitch `LOCKED`

The player controls **AI robots sent ahead of human colonists** to a new planetary system to prepare it for their arrival. **The colonists' arrival is the timer and the main failure condition.**

- Inspired in part by Simon Willison's posts about making a game.
- Shay enjoys **exploration, improvement, and economy-focused** games. Favour those loops over combat or twitch play.

## 2. Scope v1 `LOCKED`

- **One planetary system at a time** on a managed map. No multi-system galaxy or jump view yet.
- **Hosting:** public GitHub repo plus **GitHub Pages**, chosen 2026-10-26 as the simplest free host. Static only, no backend.
- **Platform:** phone-first PWA, with **iPhone Safari as the primary target**.

## 3. Build plan `LOCKED`

The game is built in credit-aware slices by Opus 5.5 High cloud agents. Shay checks usage between slices.

| Slice | Goal | Status |
| --- | --- | --- |
| **A: Scaffold** | Static PWA shell, navigation structure, time-control stub, aesthetic tokens, this doc | Done (2026-10-28) |
| **B: Loop** | Playable core loop: resources ticking, bot pips, build, explore events, readiness, arrival win/fail | Next |
| **C: Polish** | Art, feel, balance, offline precache, onboarding | Later |

Keep each slice tight. Don't pull later-slice work forward without the owner asking.

## 4. Time model

- `LOCKED` **Pauseable realtime**, not pure turns. Time advances continuously but can be paused for decisions.
- `LOCKED` **Speed controls** plus **auto-pause on important events**.
- `LOCKED` **Hard-pause when the browser tab is backgrounded or the player leaves Safari.**
- `AGENT-PROPOSED` After a background hard-pause, the game **stays paused** when the player returns, and the time bar shows "Paused · app was backgrounded". It never auto-resumes.
- `AGENT-PROPOSED` Pacing placeholders, to tune in Slice B (`src/sim/clock.ts`, `src/game/state.ts`):
  - 1× speed = 6 sim hours per real second, so one sim day takes 4 real seconds.
  - Available speeds are 1×, 2×, and 4×.
  - Colonists arrive at sim day 400, which is about 27 real minutes at 1×.
  - Fixed simulation step = 1 sim hour.

## 5. UI and navigation `LOCKED` (2026-10-26)

- **Default/home screen: the solar system map.**
- The player can **select into a habitable body viewer** to zoom into a planet, moon, or station.
- **Explore, Build, Bots, Policy** (and other modes) are **full screens you navigate into**, not lenses or overlays on the map.
- Phone-first PWA: **every screen must be easy to see and navigate on an iPhone.** That means large touch targets (≥ 44 px), readable type, safe-area aware layout, and nothing that relies on hover.

`AGENT-PROPOSED` shell details (Slice A):

- The frame has five parts, top to bottom:
  1. Header with back, title, and menu.
  2. Resource HUD.
  3. The screen itself.
  4. Time bar.
  5. Bottom dock with System, Explore, Build, Bots, and Policy.
- The HUD and time bar stay visible on every screen.
- Menu/settings is reached from the header's top-right button.
- Only planets are tap targets on the map, because moons and stations sit too close together for reliable thumb taps. Tapping a planet opens a bottom sheet with buttons for the planet and each of its moons and stations. In the body viewer, chips switch between members of the same orbital family.

## 6. Modes

1. **Exploration** `LOCKED`: direct bots broadly around a planet or system to find habitable land, resources, and dangers. This happens **through decisions and events, NOT direct movement of units on a map.**
2. **Buildings / economy** `LOCKED`:
   - A **shop** of buildings bought with resources and bot time.
   - Buildings are gated by resources, tech, other buildings, and physical constraints. For example, a gas-giant skimmer has to be built in gas-giant orbit.
   - A separate **screen of active buildings** to manage.
3. **Bots** `LOCKED`: manage and build bots. **Bot pips** are assigned to buildings to work them or improve them.
4. **Menu / Policy** `LOCKED`: these and related management screens are full navigations. Policy depth is `OPEN` (see section 12).

## 7. Body vs Build `DIRECTION` (2026-10-26)

- **Preferred:** procedural placement and appearance on the Body viewer. Colonies and stations **visibly grow** as buildings are placed or infrastructure improves.
- **Fallback:** a **hex-grid placement** system, used only if procedural growth proves too hard in practice.
- **Build = shop/assign flow. Body = the living result.**
- Slice A has a seeded procedural preview in `src/ui/bodyArt.ts`. A structure count drives a cluster of hubs and links on planets and moons, or bolted-on modules on stations. The body viewer's "Growth preview" stepper is a **placeholder**. Slice B should drive the count from real buildings and then remove the stepper.

## 8. Aesthetic `LOCKED`

- **Look:**
  - Early **Halo human/UNSC**: utilitarian, military-industrial, angular, olive and gray, functional UI.
  - **Sins of a Solar Empire**: system-scale map, a sense of economic and fleet grandeur.
- **Tone:** Tropico/Paradox-like. Slower pace, guiding the player, hands-off decisions.
- **Not:** turn-of-the-century drawn retro-future illustration. The tone is Tropico, but the **look is Halo/Sins**.

`AGENT-PROPOSED` tokens (`src/styles/tokens.css`):

- **Palette:**
  - Gunmetal surfaces (`#0e1112` to `#283133`).
  - UNSC olive drab (`#4a5530`, highlight `#9aa676`).
  - Bone text (`#e6e2d3`).
  - Amber (`#d9a441`) for selection and primary actions only.
  - Rust (`#d1603d`) for alerts.
  - Pale cyan (`#8fc7ca`) for sensor and atmosphere effects only.
- **Shape:** chamfered (clipped) corners instead of rounded ones, and a left accent stripe on panels.
- **Type:** stencil-like uppercase labels. Headings use the condensed system fonts DIN Alternate/Condensed (built into iOS) or Bahnschrift. Body text uses the system UI font. There are **no web fonts**, so the game works offline and loads fast.
- **Map:** deep-space background, glowing star, dashed orbits, an amber targeting reticle on the selected body.

## 9. Economy

- `LOCKED` **Bot pips** are the single workforce. They're used first for construction, then to operate buildings.
- `LOCKED` About 5–6 currency buckets:

| Bucket | HUD | Carries to next system | Notes |
| --- | --- | --- | --- |
| Power | PWR | Mostly no (local) | |
| Materials | MAT | Yes (small hold) | |
| Volatiles | VOL | Mostly no (local) | |
| Biomass / foodstock | BIO | Mostly no (local) | |
| Data | DAT | Yes (small hold) | |
| Parts | PRT | Yes (small hold) | **Optional** bucket: bot builds, repairs, high-tech. Exactly how optional is `OPEN`. |

- `LOCKED` **Carry-over between systems:** a small hold of Materials, Parts, and Data, plus unlocked tech. Power, Volatiles, and Biomass stay mostly local. Multi-system play is post-v1, but the economy should be modelled with this in mind.
- `LOCKED` **Colonist readiness varies by system**, depending on the type and number of incoming colonists.
- `LOCKED` **Flexible fulfilment paths.** For example, different food economies are fine as long as the capacity thresholds are met.
- `LOCKED` **Readiness axes:** safety score, housing, food capacity, jobs, leisure.
- `AGENT-PROPOSED` Slice A placeholder numbers (`src/game/state.ts`):
  - Colonists: 1,200 colonists ("Settler cohort").
  - Readiness thresholds: safety 60, housing 1,200, food 1,200, jobs 800, leisure 300.
  - Starting resources: PWR 40, MAT 120, DAT 10, PRT locked.
  - Bots: 6 bot pips.

## 10. Win / fail `LOCKED`

- **Main failure:** colonists arrive and the readiness thresholds aren't met.
- When every readiness axis is at or above its threshold at arrival, the colony is ready (`isColonyReady` in `src/game/readiness.ts`). Whether there are graded outcomes (partial success, scores) is `OPEN`.

## 11. Explicit non-goals for Slice A

- No full simulation loop, save system, complete building content, multiplayer, galaxy map, or monetization.

## 12. Open / deferred questions `OPEN`

- [ ] The exact procedural Body growth algorithm, versus the hex-grid fallback. Procedural is preferred; fall back only if needed.
- [ ] How optional Parts is, and the starting resource balances. Tune in Slice B.
- [ ] How deep the Policy screen goes. Slice A placeholders: survey priority, bot duty cycle, food strategy.
- [ ] A custom domain for GitHub Pages. None is required for v1.
- [ ] Graded arrival outcomes versus a pass/fail result.
- [ ] Pacing: real-time length of a run and the speed multipliers (section 4 has placeholders).
- [ ] Save format and storage. Probably `localStorage` or IndexedDB, local only; this is a Slice B or C decision.
- [ ] Whether the colonist profile can change mid-run (for example, more colonists announced).

## 13. Platform and tech `AGENT-PROPOSED` (2026-10-28)

| Choice | Why |
| --- | --- |
| **Vite + TypeScript, vanilla DOM/SVG** (no UI framework) | Small static bundle (~11 KB gzipped JS), no framework churn. The UI is mostly panels and SVG. Revisit only if screen state gets complex. |
| **Hash routing** (`#/body/verdance`) | GitHub Pages has no server rewrites, so deep links and refreshes need to work without a `404.html` hack. |
| **Base path `/Colony-Seed/`** (case-sensitive) in all modes | Matches the project Pages URL, and dev URLs mirror production. |
| **GitHub Actions deploy** (`.github/workflows/pages.yml`) | PRs build and test. Pushes to `main` deploy. Needs Settings → Pages → Source set to **GitHub Actions** once. |
| **Service worker** (`public/sw.js`), prod only | Network-first navigations with an offline shell fallback, and stale-while-revalidate assets. Full precache of the build manifest is a Slice C task. |
| **Placeholder icons** generated by `scripts/make-icons.mjs` | No image tooling dependency. Replace them with real art in Slice C. |
| **Vitest** for pure logic | The clock and router are DOM-free and unit tested. Keep sim logic DOM-free. |
| **Placeholder system "Tessaly"** (`src/data/system.ts`) | Cinder (hot inner rock), Verdance (temperate, primary candidate) with moon Lantern and seed vessel SV Meridian, gas giant Brume with ice moon Tether, and the Shale Belt. All names are placeholders. |

## 14. Code map: where Slice B plugs in

| Concern | File | Notes for Slice B |
| --- | --- | --- |
| Time | `src/sim/clock.ts` | Subscribe sim systems with `clock.onTick((stepHours, snap) => …)`. Don't create other timers. |
| Background hard-pause | `src/sim/clockDriver.ts` | Already enforces `visibilitychange`, `pagehide`, and `freeze`. |
| Events and auto-pause | `src/app/events.ts` | Route all game events through `raiseEvent(ctx, detail)`. It respects the auto-pause setting. Add an event log here. |
| Game state | `src/game/state.ts` | Serializable, updated immutably via `ctx.game.update(...)`. This is what gets saved. |
| UI-only state | `src/game/ui.ts` | Selection, tabs, settings. Never saved with the game. |
| Resources / readiness | `src/game/resources.ts`, `src/game/readiness.ts` | Definitions plus helpers. |
| System data | `src/data/system.ts` | Keep the `SystemBody` shape stable. |
| Screens | `src/screens/*.ts` | Each one is `(ctx, args) => { el, title, kicker?, dispose? }`. Register it in `src/app/routes.ts`. |
| Body growth art | `src/ui/bodyArt.ts` | Feed `growth` from real structures. |
| Styles | `src/styles/tokens.css` first | Use tokens and avoid raw colours in components. |

## 15. Platform constraints to preserve

- iPhone Safari first. Test at 375×667 (iPhone SE) and 393×852 (iPhone 15/16).
- Honour `env(safe-area-inset-*)`, and use `100dvh` for the app frame.
- Every tap target is ≥ 44×44 px. Nothing depends on hover; hover styles are wrapped in `@media (hover: hover)`.
- The base font size is 16 px, which prevents iOS zoom on focused inputs.
- Respect `prefers-reduced-motion`.

## 16. Decision log

| Date | Decision | Status |
| --- | --- | --- |
| ≤ 2026-10-26 | Core pitch: bots prepare a system, and colonist arrival is the timer and the fail condition | Locked |
| ≤ 2026-10-26 | Pauseable realtime with speeds, auto-pause on events, hard-pause on background | Locked |
| ≤ 2026-10-26 | Modes: Exploration (decision/event driven), Buildings/economy, Bots (pips), Menu/Policy | Locked |
| ≤ 2026-10-26 | Economy: bot pips workforce, 5–6 buckets, carry-over rules, readiness axes | Locked |
| ≤ 2026-10-26 | Aesthetic: Halo UNSC plus Sins look, with a Tropico/Paradox tone | Locked |
| 2026-10-26 | Host on public GitHub repo plus GitHub Pages | Locked |
| 2026-10-26 | Navigation: system map is home, body viewer, modes are full screens (not map lenses) | Locked |
| 2026-10-26 | Body vs Build: procedural growth on Body preferred, hex grid as fallback | Direction |
| 2026-10-28 | Slice A stack and shell choices (sections 4, 5, 8, 9, 13 `AGENT-PROPOSED` items) | Agent-proposed |
