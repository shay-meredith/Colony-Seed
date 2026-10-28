import { s } from '../core/dom';
import { seeded } from '../core/random';
import type { SystemBody } from '../data/system';

const R = 150;

/**
 * Procedural body portrait. `growth` is the number of structures to draw; in
 * Slice B it should come from placed buildings/infrastructure so colonies and
 * stations visibly grow (design decision: procedural first, hex grid fallback).
 * Placement is seeded by body id, so the same body always grows the same way.
 */
export function renderBodyArt(body: SystemBody, growth: number): SVGSVGElement {
  const svg = s('svg', {
    class: 'body-art',
    viewBox: '-200 -200 400 400',
    role: 'img',
    'aria-label': `${body.name} portrait, ${growth} structures`,
  });
  svg.append(defs(body));
  if (body.kind === 'station') drawStation(svg, body, growth);
  else drawWorld(svg, body, growth);
  return svg;
}

function defs(body: SystemBody): SVGDefsElement {
  const id = body.id;
  return s(
    'defs',
    null,
    s(
      'radialGradient',
      { id: `lit-${id}`, cx: '0.32', cy: '0.3', r: '0.85' },
      s('stop', { offset: '0', 'stop-color': '#ffffff', 'stop-opacity': '0.28' }),
      s('stop', { offset: '0.45', 'stop-color': '#000000', 'stop-opacity': '0' }),
      s('stop', { offset: '0.8', 'stop-color': '#000000', 'stop-opacity': '0.55' }),
      s('stop', { offset: '1', 'stop-color': '#000000', 'stop-opacity': '0.85' }),
    ),
    s(
      'radialGradient',
      { id: `atmo-${id}`, r: '0.5' },
      s('stop', { offset: '0.86', 'stop-color': '#9fd3d6', 'stop-opacity': '0' }),
      s('stop', { offset: '0.93', 'stop-color': '#9fd3d6', 'stop-opacity': '0.35' }),
      s('stop', { offset: '1', 'stop-color': '#9fd3d6', 'stop-opacity': '0' }),
    ),
    s('clipPath', { id: `disc-${id}` }, s('circle', { r: R })),
  );
}

function drawWorld(svg: SVGSVGElement, body: SystemBody, growth: number) {
  const rand = seeded(`world:${body.id}`);
  const gasGiant = body.kind === 'planet' && body.hasAtmosphere && !body.habitable;

  if (body.hasAtmosphere) svg.append(s('circle', { r: R * 1.16, fill: `url(#atmo-${body.id})` }));
  svg.append(s('circle', { r: R, fill: body.color }));

  const surface = s('g', { 'clip-path': `url(#disc-${body.id})` });
  if (gasGiant) {
    for (let i = 0; i < 9; i++) {
      const y = -R + (i + 0.5) * ((R * 2) / 9) + (rand() - 0.5) * 12;
      surface.append(
        s('rect', {
          x: -R,
          y: y - 8 - rand() * 10,
          width: R * 2,
          height: 10 + rand() * 18,
          fill: i % 2 ? '#000' : '#fff',
          opacity: (0.05 + rand() * 0.1).toFixed(2),
        }),
      );
    }
  } else {
    for (let i = 0; i < 14; i++) {
      surface.append(
        s('ellipse', {
          cx: (rand() * 2 - 1) * R,
          cy: (rand() * 2 - 1) * R,
          rx: 14 + rand() * 46,
          ry: 8 + rand() * 26,
          transform: `rotate(${Math.round(rand() * 180)})`,
          fill: rand() > 0.5 ? '#000' : '#fff',
          opacity: (0.06 + rand() * 0.1).toFixed(2),
        }),
      );
    }
  }
  svg.append(surface);

  if (body.habitable && growth > 0) svg.append(colonyLayer(body, growth));

  svg.append(s('circle', { r: R, fill: `url(#lit-${body.id})`, 'pointer-events': 'none' }));
  svg.append(s('circle', { class: 'body-art__rim', r: R }));
}

/** Seeded cluster on the lit hemisphere; spreads outward as growth increases. */
function colonyLayer(body: SystemBody, growth: number): SVGGElement {
  const rand = seeded(`colony:${body.id}`);
  const site = { x: -40 + rand() * 30, y: -30 + rand() * 30 };
  const g = s('g', { class: 'colony', 'clip-path': `url(#disc-${body.id})` });
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < growth; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 6 + Math.sqrt(i) * 14 * (0.6 + rand() * 0.6);
    const p = { x: site.x + Math.cos(angle) * dist, y: site.y + Math.sin(angle) * dist };
    const nearest = points.reduce<{ x: number; y: number } | null>((best, q) => {
      if (!best) return q;
      return Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y) ? q : best;
    }, null);
    if (nearest) g.append(s('line', { class: 'colony__link', x1: nearest.x, y1: nearest.y, x2: p.x, y2: p.y }));
    points.push(p);
  }
  for (const [i, p] of points.entries()) {
    const size = i === 0 ? 7 : 3.5 + rand() * 2.5;
    g.append(
      s('rect', {
        class: i === 0 ? 'colony__hub' : 'colony__node',
        x: p.x - size,
        y: p.y - size,
        width: size * 2,
        height: size * 2,
        transform: `rotate(${i === 0 ? 45 : Math.round(rand() * 90)} ${p.x} ${p.y})`,
      }),
    );
  }
  return g;
}

/** Station hull: spine + spin ring, with modules bolted on as growth increases. */
function drawStation(svg: SVGSVGElement, body: SystemBody, growth: number) {
  const rand = seeded(`station:${body.id}`);
  const hull = s('g', { class: 'station', transform: 'rotate(-18)' });
  hull.append(
    s('ellipse', { class: 'station__ring', rx: 120, ry: 34 }),
    s('polygon', {
      class: 'station__spine',
      points: '-150,-10 -130,-18 130,-18 150,-10 150,10 130,18 -130,18 -150,10',
    }),
    s('rect', { class: 'station__core', x: -26, y: -30, width: 52, height: 60 }),
  );
  for (let i = 0; i < growth; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const slot = Math.floor(i / 2);
    const x = -110 + ((slot * 37) % 220) + rand() * 6;
    const w = 18 + rand() * 14;
    const hgt = 16 + rand() * 18;
    hull.append(
      s('rect', {
        class: 'station__module',
        x: x - w / 2,
        y: side < 0 ? -18 - hgt : 18,
        width: w,
        height: hgt,
      }),
    );
  }
  svg.append(hull);
}
