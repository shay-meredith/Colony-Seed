import type { AppContext } from '../app/context';
import { clear, h } from '../core/dom';
import { RESOURCES } from '../game/resources';
import type { GameState } from '../game/state';
import { icon } from './icons';

/** Resource HUD: the six currency buckets, always visible. */
export function createHud(ctx: AppContext): HTMLElement {
  const list = h('ul', { class: 'hud__list' });
  const root = h('div', { class: 'hud', role: 'region', 'aria-label': 'Resources' }, list);

  const render = (state: GameState) => {
    clear(list);
    for (const def of RESOURCES) {
      const stock = state.resources[def.id];
      const rate = stock.ratePerDay;
      list.append(
        h(
          'li',
          {
            class: `hud__item hud__item--${def.id}${stock.locked ? ' is-locked' : ''}`,
            title: `${def.label}: ${def.blurb}`,
          },
          h('span', { class: 'hud__code' }, def.code),
          stock.locked
            ? h('span', { class: 'hud__value', 'aria-label': `${def.label} locked` }, icon('lock', 'icon icon--sm'))
            : h('span', { class: 'hud__value', 'aria-label': `${def.label} ${Math.round(stock.amount)}` }, formatAmount(stock.amount)),
          !stock.locked && rate !== 0
            ? h('span', { class: `hud__rate ${rate > 0 ? 'is-up' : 'is-down'}` }, `${rate > 0 ? '+' : ''}${rate}`)
            : null,
        ),
      );
    }
  };

  render(ctx.game.get());
  ctx.game.subscribe((state, prev) => {
    if (state.resources !== prev.resources) render(state);
  });
  return root;
}

function formatAmount(n: number): string {
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toFixed(0)}k`;
  if (Math.abs(n) >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}
