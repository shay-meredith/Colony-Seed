import { clear, h } from '../core/dom';
import { getBody } from '../data/system';
import { button, costList, emptyState, panel, type Cost } from '../ui/components';
import type { ScreenFactory } from './types';

interface BuildingStub {
  name: string;
  effect: string;
  cost: Cost;
  gate?: string;
}

const SHOP: BuildingStub[] = [
  { name: 'Solar array', effect: '+Power', cost: { materials: 30, botDays: 4 } },
  { name: 'Habitat module', effect: '+100 Housing', cost: { materials: 80, power: 10, botDays: 8 }, gate: 'Requires surveyed site' },
  { name: 'Hydroponics bay', effect: '+80 Food capacity', cost: { materials: 40, volatiles: 20, botDays: 6 }, gate: 'Requires Habitat module' },
  { name: 'Fabricator', effect: 'Unlocks Parts', cost: { materials: 60, power: 20, data: 20, botDays: 10 }, gate: 'Requires 20 Data' },
  { name: 'Volatiles skimmer', effect: '+Volatiles', cost: { materials: 90, botDays: 12 }, gate: 'Gas giant orbit only' },
];

/** Build = shop + assign flow. The visible result lives on the Body viewer. */
export const buildScreen: ScreenFactory = (ctx, { location }) => {
  const site = getBody(ctx.system, location.query.get('body') ?? '');
  const content = h('div', { class: 'tab-panel' });

  const tabs = (['shop', 'active'] as const).map((id) =>
    h(
      'button',
      {
        type: 'button',
        class: 'seg__btn',
        role: 'tab',
        onClick: () => ctx.ui.update((ui) => ({ ...ui, buildTab: id })),
      },
      id === 'shop' ? 'Shop' : 'Active',
    ),
  );

  const render = () => {
    const tab = ctx.ui.get().buildTab;
    tabs.forEach((btn, i) => btn.setAttribute('aria-selected', String((i === 0 ? 'shop' : 'active') === tab)));
    clear(content);
    content.append(
      tab === 'shop'
        ? panel(
            { title: site ? `Shop · ${site.name}` : 'Shop', tag: 'Slice B' },
            h(
              'ul',
              { class: 'cards' },
              ...SHOP.map((b) =>
                h(
                  'li',
                  { class: 'card' },
                  h('h3', { class: 'card__title' }, b.name),
                  h('p', { class: 'card__meta' }, b.effect),
                  costList(b.cost),
                  b.gate ? h('p', { class: 'card__gate' }, b.gate) : null,
                  button('Queue', { disabled: true }),
                ),
              ),
            ),
          )
        : panel(
            { title: 'Active buildings', tag: 'Slice B' },
            emptyState('Nothing built yet', 'Running buildings, assigned pips and upgrades will be managed here.'),
          ),
    );
  };

  render();
  const unsub = ctx.ui.subscribe((ui, prev) => {
    if (ui.buildTab !== prev.buildTab) render();
  });

  const el = h(
    'div',
    { class: 'screen' },
    h('div', { class: 'seg seg--wide', role: 'tablist', 'aria-label': 'Build views' }, ...tabs),
    content,
  );
  return { el, title: 'Build', kicker: 'Construction & economy', dispose: unsub };
};
