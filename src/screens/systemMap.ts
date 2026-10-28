import type { AppContext } from '../app/context';
import { clear, h, s } from '../core/dom';
import { seeded } from '../core/random';
import { childrenOf, getBody, KIND_LABEL, mapPosition, type SystemBody } from '../data/system';
import { READINESS, readinessRatio } from '../game/readiness';
import { button, meter, panel } from '../ui/components';
import type { ScreenFactory } from './types';

const VIEW = 480;

/**
 * Home screen. Planets are the only tap targets on the map (satellites are too
 * close together for reliable thumb taps); the sheet lists a planet's moons
 * and stations so every body is still one tap away.
 */
export const systemMapScreen: ScreenFactory = (ctx) => {
  const { system } = ctx;
  const planets = system.bodies.filter((b) => b.kind === 'planet');

  const reticle = s('g', { class: 'map-reticle', 'aria-hidden': 'true' });
  const svg = s(
    'svg',
    {
      class: 'map-svg',
      viewBox: `${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'group',
      'aria-label': `${system.name} map`,
    },
    mapDefs(),
    starfield(system.id),
    ...system.belts.map((belt) => s('circle', { class: 'map-belt', r: belt.radius })),
    ...planets.map((p) => s('circle', { class: 'map-orbit', r: p.orbitRadius })),
    s('circle', { class: 'map-star-glow', r: 90, fill: 'url(#star-glow)' }),
    s('circle', { class: 'map-star', r: 24 }),
    ...planets.map((p) => planetGroup(ctx, p)),
    reticle,
  );

  svg.addEventListener('click', (e) => {
    const target = (e.target as Element).closest<SVGGElement>('.map-body');
    select(target?.dataset.id ?? null);
  });
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = (e.target as Element).closest<SVGGElement>('.map-body');
    if (target) {
      e.preventDefault();
      select(target.dataset.id ?? null);
    }
  });

  const sheet = h('div', { class: 'map-sheet' });
  const el = h('div', { class: 'screen screen--map' }, h('div', { class: 'map-viewport' }, svg), sheet);

  function select(id: string | null) {
    ctx.ui.update((ui) => (ui.selectedBodyId === id ? ui : { ...ui, selectedBodyId: id }));
  }

  function render() {
    const selected = ctx.ui.get().selectedBodyId;
    const body = selected ? getBody(system, selected) : undefined;
    drawReticle(reticle, body ? mapPosition(system, body) : null, body?.radius ?? 0);
    for (const g of svg.querySelectorAll<SVGGElement>('.map-body')) {
      g.classList.toggle('is-selected', g.dataset.id === selected);
      g.setAttribute('aria-pressed', String(g.dataset.id === selected));
    }
    clear(sheet);
    sheet.append(body ? selectedSheet(ctx, body) : overviewSheet(ctx));
  }

  render();
  const unsub = ctx.ui.subscribe((ui, prev) => {
    if (ui.selectedBodyId !== prev.selectedBodyId) render();
  });

  return { el, title: system.name, kicker: `${system.starClass} · Bot command`, dispose: unsub };
};

function mapDefs(): SVGDefsElement {
  return s(
    'defs',
    null,
    s(
      'radialGradient',
      { id: 'star-glow' },
      s('stop', { offset: '0', 'stop-color': '#fff3cf', 'stop-opacity': '0.95' }),
      s('stop', { offset: '0.3', 'stop-color': '#e9b85a', 'stop-opacity': '0.45' }),
      s('stop', { offset: '1', 'stop-color': '#e9b85a', 'stop-opacity': '0' }),
    ),
    s(
      'radialGradient',
      { id: 'body-shade', cx: '0.35', cy: '0.35', r: '0.75' },
      s('stop', { offset: '0', 'stop-color': '#ffffff', 'stop-opacity': '0.25' }),
      s('stop', { offset: '0.55', 'stop-color': '#000000', 'stop-opacity': '0' }),
      s('stop', { offset: '1', 'stop-color': '#000000', 'stop-opacity': '0.65' }),
    ),
  );
}

function starfield(seed: string): SVGGElement {
  const rand = seeded(`stars:${seed}`);
  const g = s('g', { class: 'map-stars', 'aria-hidden': 'true' });
  for (let i = 0; i < 140; i++) {
    g.append(
      s('circle', {
        cx: (rand() * 2 - 1) * VIEW,
        cy: (rand() * 2 - 1) * VIEW,
        r: (0.6 + rand() * 1.6).toFixed(2),
        opacity: (0.15 + rand() * 0.5).toFixed(2),
      }),
    );
  }
  return g;
}

function planetGroup(ctx: AppContext, planet: SystemBody): SVGGElement {
  const { system } = ctx;
  const pos = mapPosition(system, planet);
  const sats = childrenOf(system, planet.id);
  const g = s('g', {
    class: `map-body${planet.habitable ? ' is-habitable' : ''}`,
    dataset: { id: planet.id },
    tabindex: '0',
    role: 'button',
    'aria-label': `${planet.name}, ${KIND_LABEL[planet.kind]}${planet.habitable ? ', colony candidate' : ''}`,
  });

  g.append(s('circle', { class: 'map-hit', cx: pos.x, cy: pos.y, r: Math.max(planet.radius + 34, 62) }));
  for (const sat of sats) {
    g.append(s('circle', { class: 'map-orbit map-orbit--sat', cx: pos.x, cy: pos.y, r: sat.orbitRadius }));
  }
  g.append(
    s('circle', { class: 'map-planet', cx: pos.x, cy: pos.y, r: planet.radius, fill: planet.color }),
    s('circle', { cx: pos.x, cy: pos.y, r: planet.radius, fill: 'url(#body-shade)', 'pointer-events': 'none' }),
  );
  for (const sat of sats) {
    const sp = mapPosition(system, sat);
    if (sat.kind === 'station') {
      const r = sat.radius;
      g.append(
        s('rect', {
          class: 'map-station',
          x: sp.x - r,
          y: sp.y - r,
          width: r * 2,
          height: r * 2,
          transform: `rotate(45 ${sp.x} ${sp.y})`,
        }),
      );
    } else {
      g.append(s('circle', { class: 'map-moon', cx: sp.x, cy: sp.y, r: sat.radius, fill: sat.color }));
    }
  }
  g.append(
    s('text', { class: 'map-label', x: pos.x, y: pos.y + planet.radius + 38, 'text-anchor': 'middle' }, planet.name),
  );
  return g;
}

function drawReticle(g: SVGGElement, pos: { x: number; y: number } | null, radius: number) {
  clear(g);
  if (!pos) return;
  const r = radius + 16;
  const len = 12;
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  for (const [sx, sy] of corners) {
    const cx = pos.x + sx * r;
    const cy = pos.y + sy * r;
    g.append(s('path', { d: `M${cx} ${cy - sy * len} L${cx} ${cy} L${cx - sx * len} ${cy}` }));
  }
}

function selectedSheet(ctx: AppContext, body: SystemBody): HTMLElement {
  const sats = childrenOf(ctx.system, body.id);
  return panel(
    { class: 'sheet' },
    h(
      'div',
      { class: 'sheet__head' },
      h('p', { class: 'kicker' }, `${KIND_LABEL[body.kind]}${body.habitable ? ' · Colony candidate' : ' · Resource body'}`),
      h('h2', { class: 'sheet__title' }, body.name),
      h('p', { class: 'sheet__body' }, body.summary),
    ),
    button(`View ${body.name}`, {
      variant: 'primary',
      class: 'sheet__primary',
      onClick: () => ctx.navigate(`/body/${body.id}`),
    }),
    sats.length
      ? h(
          'nav',
          { class: 'chips sheet__sats', 'aria-label': `In orbit of ${body.name}` },
          ...sats.map((sat) =>
            h(
              'a',
              { class: 'chip', href: `#/body/${sat.id}` },
              h('span', { class: 'chip__kind' }, KIND_LABEL[sat.kind]),
              sat.name,
            ),
          ),
        )
      : null,
  );
}

function overviewSheet(ctx: AppContext): HTMLElement {
  const { readiness, colonists } = ctx.game.get();
  return panel(
    { title: 'Colony readiness', class: 'sheet' },
    h('p', { class: 'sheet__body' }, `Incoming: ${colonists.count.toLocaleString()} · ${colonists.profile}. Tap a world to inspect it.`),
    h(
      'ul',
      { class: 'readiness' },
      ...READINESS.map((def) => {
        const v = readiness[def.id];
        return h(
          'li',
          { class: 'readiness__row' },
          h('span', { class: 'readiness__label' }, def.label),
          meter(readinessRatio(v), def.label),
          h('span', { class: 'readiness__value' }, `${v.current}/${v.required}`),
        );
      }),
    ),
  );
}
