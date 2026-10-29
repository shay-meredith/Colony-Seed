import { clear, h } from '../core/dom';
import { BUILDINGS, getBuilding } from '../game/catalog';
import { buildBlocker, startBuild } from '../game/sim';
import { bindGame, crewRow, jobRow, siteChips, siteFromQuery, workforceKey } from '../ui/assignments';
import { button, costList, emptyState, panel } from '../ui/components';
import type { ScreenFactory } from './types';

/** Build = shop + assign flow. The visible result lives on the Body viewer. */
export const buildScreen: ScreenFactory = (ctx, { location }) => {
  const site = siteFromQuery(ctx, location.query);
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

  const shop = () => {
    const list = h('ul', { class: 'cards' });
    const unsub = bindGame(
      ctx,
      list,
      (s) => `${workforceKey(s)}|${BUILDINGS.map((b) => buildBlocker(s, ctx.system, b, site.id)).join(',')}`,
      (state) =>
        BUILDINGS.map((b) => {
          const blocker = buildBlocker(state, ctx.system, b, site.id);
          return h(
            'li',
            { class: 'card' },
            h('h3', { class: 'card__title' }, b.name),
            h('p', { class: 'card__meta' }, b.effect),
            costList({ ...b.cost, botDays: b.botDays }),
            blocker ? h('p', { class: 'card__gate' }, blocker) : null,
            button('Queue', {
              variant: blocker ? 'secondary' : 'primary',
              disabled: !!blocker,
              onClick: () => {
                ctx.game.update((s) => startBuild(s, ctx.system, b.id, site.id));
                ctx.ui.update((ui) => ({ ...ui, buildTab: 'active' }));
              },
            }),
          );
        }),
    );
    return { el: panel({ title: `Shop · ${site.name}` }, list), unsub };
  };

  const active = () => {
    const body = h('div');
    const unsub = bindGame(ctx, body, workforceKey, (state) => {
      const jobs = state.jobs.filter((j) => j.kind === 'build');
      const crewed = state.buildings.map((b) => crewRow(ctx, state, b)).filter((r): r is HTMLElement => !!r);
      const unattended = state.buildings.filter((b) => getBuilding(b.defId)?.crew === 0);
      if (!jobs.length && !state.buildings.length) {
        return [emptyState('Nothing built yet', 'Queue a building from the Shop. Bots build it, then stay on to run it.')];
      }
      return [
        jobs.length ? h('ul', { class: 'assigns' }, ...jobs.map((j) => jobRow(ctx, state, j))) : null,
        crewed.length ? h('ul', { class: 'assigns' }, ...crewed) : null,
        unattended.length
          ? h(
              'p',
              { class: 'muted' },
              `Running unattended: ${unattended.map((b) => getBuilding(b.defId)?.name).join(', ')}.`,
            )
          : null,
      ];
    });
    return { el: panel({ title: 'Construction & crews' }, body), unsub };
  };

  let unsubTab: (() => void) | null = null;
  const render = () => {
    const tab = ctx.ui.get().buildTab;
    tabs.forEach((btn, i) => btn.setAttribute('aria-selected', String((i === 0 ? 'shop' : 'active') === tab)));
    unsubTab?.();
    clear(content);
    const view = tab === 'shop' ? shop() : active();
    unsubTab = view.unsub;
    content.append(view.el);
  };

  render();
  const unsub = ctx.ui.subscribe((ui, prev) => {
    if (ui.buildTab !== prev.buildTab) render();
  });

  const el = h(
    'div',
    { class: 'screen' },
    siteChips(ctx, site.id, '/build'),
    h('div', { class: 'seg seg--wide', role: 'tablist', 'aria-label': 'Build views' }, ...tabs),
    content,
  );
  return {
    el,
    title: 'Build',
    kicker: 'Construction & economy',
    dispose: () => {
      unsub();
      unsubTab?.();
    },
  };
};
