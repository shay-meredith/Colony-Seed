import type { AppContext } from '../app/context';
import { clear, h } from '../core/dom';
import { getBody, KIND_LABEL, type SystemBody } from '../data/system';
import { getBuilding, getDirective } from '../game/catalog';
import { idlePips, setCrew, setJobPips } from '../game/sim';
import type { Building, GameState, Job } from '../game/state';
import { button, meter } from './components';

/**
 * Re-renders `container` only when `key(state)` changes, so buttons aren't
 * swapped out from under the player's finger on every clock tick. Job progress
 * meters are updated in place on every state change instead.
 */
export function bindGame(
  ctx: AppContext,
  container: HTMLElement,
  key: (state: GameState) => string,
  render: (state: GameState) => (Node | null)[],
): () => void {
  let lastKey: string | null = null;
  const update = (state: GameState) => {
    const k = key(state);
    if (k !== lastKey) {
      lastKey = k;
      clear(container);
      container.append(...render(state).filter((n): n is Node => !!n));
    }
    updateProgress(container, state);
  };
  update(ctx.game.get());
  return ctx.game.subscribe(update);
}

/** Key parts shared by every screen that shows workforce state. */
export function workforceKey(state: GameState): string {
  return [
    state.bots.total,
    state.jobs.map((j) => `${j.id}:${j.pips}`).join(','),
    state.buildings.map((b) => `${b.id}:${b.crew}`).join(','),
  ].join('|');
}

function updateProgress(container: HTMLElement, state: GameState): void {
  for (const el of container.querySelectorAll<HTMLElement>('[data-job]')) {
    const job = state.jobs.find((j) => String(j.id) === el.dataset.job);
    if (!job) continue;
    const pct = Math.round((job.progress / job.work) * 100);
    const fill = el.querySelector<HTMLElement>('.meter__fill');
    if (fill) fill.style.width = `${pct}%`;
    el.querySelector('.meter')?.setAttribute('aria-valuenow', String(pct));
    const eta = el.querySelector('.assign__eta');
    if (eta) eta.textContent = etaText(job);
  }
}

function etaText(job: Job): string {
  const pct = Math.round((job.progress / job.work) * 100);
  if (job.pips <= 0) return `${pct}% · paused, no bots`;
  const days = Math.ceil((job.work - job.progress) / job.pips);
  return `${pct}% · ~${days}d left`;
}

function stepper(label: string, value: number, max: number | null, onSet: (n: number) => void, canAdd: boolean): HTMLElement {
  return h(
    'div',
    { class: 'stepper stepper--sm' },
    button('−', { ariaLabel: `Remove a bot from ${label}`, disabled: value <= 0, onClick: () => onSet(value - 1) }),
    h('output', { class: 'stepper__value', 'aria-label': `${value} bots on ${label}` }, max === null ? String(value) : `${value}/${max}`),
    button('+', { ariaLabel: `Add a bot to ${label}`, disabled: !canAdd, onClick: () => onSet(value + 1) }),
  );
}

/** A construction or survey job with its pip stepper and progress. */
export function jobRow(ctx: AppContext, state: GameState, job: Job): HTMLElement {
  const name = job.kind === 'build' ? getBuilding(job.defId)?.name : getDirective(job.defId)?.title;
  const site = getBody(ctx.system, job.bodyId)?.name ?? job.bodyId;
  const label = name ?? job.defId;
  const idle = idlePips(state);
  const pct = (job.progress / job.work) * 100;
  return h(
    'li',
    { class: 'assign', dataset: { job: String(job.id) } },
    h(
      'div',
      { class: 'assign__head' },
      h('div', null, h('p', { class: 'assign__title' }, label), h('p', { class: 'assign__meta' }, `${job.kind === 'build' ? 'Construction' : 'Survey'} · ${site}`)),
      stepper(label, job.pips, null, (n) => ctx.game.update((s) => setJobPips(s, job.id, n)), idle > 0),
    ),
    meter(pct / 100, `${label} progress`),
    h('p', { class: 'assign__eta' }, etaText(job)),
  );
}

/** A finished building that needs crew to run. */
export function crewRow(ctx: AppContext, state: GameState, building: Building): HTMLElement | null {
  const def = getBuilding(building.defId);
  if (!def || def.crew === 0) return null;
  const site = getBody(ctx.system, building.bodyId)?.name ?? building.bodyId;
  const idle = idlePips(state);
  const status = building.crew === 0 ? 'Idle: no crew' : building.crew < def.crew ? 'Partly crewed' : 'Operating';
  return h(
    'li',
    { class: 'assign' },
    h(
      'div',
      { class: 'assign__head' },
      h('div', null, h('p', { class: 'assign__title' }, def.name), h('p', { class: 'assign__meta' }, `${status} · ${site}`)),
      stepper(
        def.name,
        building.crew,
        def.crew,
        (n) => ctx.game.update((s) => setCrew(s, building.id, n)),
        idle > 0 && building.crew < def.crew,
      ),
    ),
    h('p', { class: 'assign__eta' }, def.effect),
  );
}

/** Chip row for choosing which body a Build or Explore screen targets. */
export function siteChips(ctx: AppContext, currentId: string, route: string): HTMLElement {
  return h(
    'nav',
    { class: 'chips', 'aria-label': 'Site' },
    ...ctx.system.bodies
      .filter((b) => b.kind !== 'star')
      .map((b) =>
        h(
          'a',
          {
            class: `chip${b.id === currentId ? ' is-active' : ''}`,
            href: `#${route}?body=${b.id}`,
            'aria-current': b.id === currentId ? 'page' : undefined,
          },
          h('span', { class: 'chip__kind' }, KIND_LABEL[b.kind]),
          b.name,
        ),
      ),
  );
}

/** The body a Build/Explore screen targets: `?body=` if valid, else the primary colony candidate. */
export function siteFromQuery(ctx: AppContext, query: URLSearchParams): SystemBody {
  const body = getBody(ctx.system, query.get('body') ?? '');
  if (body && body.kind !== 'star') return body;
  return ctx.system.bodies.find((b) => b.habitable) ?? ctx.system.bodies[0]!;
}
