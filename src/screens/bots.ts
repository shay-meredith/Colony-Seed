import { h } from '../core/dom';
import { button, emptyState, panel, statGrid } from '../ui/components';
import type { ScreenFactory } from './types';

/** Bot pips: one workforce, used first for construction then for operation. */
export const botsScreen: ScreenFactory = (ctx) => {
  const { bots, resources } = ctx.game.get();
  const pips = Array.from({ length: bots.total }, (_, i) =>
    h('li', { class: `pip${i < bots.assigned ? ' is-assigned' : ''}`, 'aria-hidden': 'true' }),
  );

  const el = h(
    'div',
    { class: 'screen' },
    panel(
      { title: 'Workforce' },
      h('ul', { class: 'pips', 'aria-label': `${bots.assigned} of ${bots.total} bot pips assigned` }, ...pips),
      statGrid([
        ['Total pips', String(bots.total)],
        ['Assigned', String(bots.assigned)],
        ['Idle', String(bots.total - bots.assigned)],
      ]),
      h(
        'div',
        { class: 'actions' },
        button('Fabricate bot', { disabled: true }),
        h('p', { class: 'card__gate' }, resources.parts.locked ? 'Needs Parts (locked: build a Fabricator)' : 'Costs Parts'),
      ),
    ),
    panel(
      { title: 'Assignments', tag: 'Slice B' },
      emptyState('All bots idle', 'Assign pips to construction jobs or running buildings to work or improve them.'),
    ),
  );
  return { el, title: 'Bots', kicker: 'Workforce' };
};
