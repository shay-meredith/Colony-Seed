import { h } from '../core/dom';
import { getBody } from '../data/system';
import { button, costList, emptyState, panel, type Cost } from '../ui/components';
import type { ScreenFactory } from './types';

interface DirectiveStub {
  title: string;
  detail: string;
  pips: number;
  days: number;
  cost: Cost;
  gate?: string;
}

const DIRECTIVES: DirectiveStub[] = [
  { title: 'Orbital survey sweep', detail: 'Map terrain, hazards and resource hints from orbit.', pips: 1, days: 3, cost: { power: 5 } },
  {
    title: 'Ground survey: landing zone',
    detail: 'Send bots down to confirm a safe colony site.',
    pips: 2,
    days: 6,
    cost: { power: 10 },
    gate: 'Requires orbital survey',
  },
  {
    title: 'Deep core sample',
    detail: 'Look for ore, water and geothermal potential.',
    pips: 2,
    days: 10,
    cost: { power: 15, materials: 10 },
    gate: 'Requires ground survey',
  },
];

/**
 * Exploration is decision/event driven: the player issues directives and
 * resolves events. Bots are never moved around a map directly.
 */
export const exploreScreen: ScreenFactory = (ctx, { location }) => {
  const target = getBody(ctx.system, location.query.get('body') ?? '');
  const el = h(
    'div',
    { class: 'screen' },
    h(
      'p',
      { class: 'lede' },
      'Direct survey teams with directives. Findings arrive as events that need your decision.',
    ),
    panel(
      { title: target ? `Directives · ${target.name}` : 'Directives · System-wide', tag: 'Slice B' },
      h(
        'ul',
        { class: 'cards' },
        ...DIRECTIVES.map((d) =>
          h(
            'li',
            { class: 'card' },
            h('h3', { class: 'card__title' }, d.title),
            h('p', { class: 'card__body' }, d.detail),
            h('p', { class: 'card__meta' }, `${d.pips} bot pip${d.pips > 1 ? 's' : ''} · ${d.days} days`),
            costList(d.cost),
            d.gate ? h('p', { class: 'card__gate' }, d.gate) : null,
            button('Dispatch', { disabled: true }),
          ),
        ),
      ),
    ),
    panel({ title: 'Event log' }, emptyState('No reports yet', 'Survey events and discoveries will appear here.')),
  );
  return { el, title: 'Explore', kicker: 'Survey command' };
};
