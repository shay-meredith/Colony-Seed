import { h } from '../core/dom';
import { panel } from '../ui/components';
import type { ScreenFactory } from './types';

const POLICIES: { name: string; options: string[] }[] = [
  { name: 'Survey priority', options: ['Safety first', 'Balanced', 'Resources first'] },
  { name: 'Bot duty cycle', options: ['Standard', 'Overclock (more wear)'] },
  { name: 'Food strategy', options: ['Hydroponics', 'Native biomass', 'Mixed'] },
];

/** Policy depth is an open design question; this is a shape-only stub. */
export const policyScreen: ScreenFactory = () => {
  const el = h(
    'div',
    { class: 'screen' },
    h('p', { class: 'lede' }, 'Standing orders for the bot collective. Slow, hands-off levers that shape the colony.'),
    ...POLICIES.map((p) =>
      panel(
        { title: p.name, tag: 'Open question' },
        h(
          'fieldset',
          { class: 'choice', disabled: true },
          h('legend', { class: 'visually-hidden' }, p.name),
          ...p.options.map((opt, i) =>
            h(
              'label',
              { class: 'choice__opt' },
              h('input', { type: 'radio', name: p.name, checked: i === 0 }),
              h('span', null, opt),
            ),
          ),
        ),
      ),
    ),
  );
  return { el, title: 'Policy', kicker: 'Standing orders' };
};
