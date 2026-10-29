import { h } from '../core/dom';
import { DIRECTIVES } from '../game/catalog';
import { directiveBlocker, dispatchSurvey } from '../game/sim';
import { formatMissionTime } from '../sim/time';
import { bindGame, siteChips, siteFromQuery, workforceKey } from '../ui/assignments';
import { button, costList, emptyState, panel } from '../ui/components';
import type { ScreenFactory } from './types';

/**
 * Exploration is decision/event driven: the player issues directives and
 * resolves events. Bots are never moved around a map directly.
 */
export const exploreScreen: ScreenFactory = (ctx, { location }) => {
  const target = siteFromQuery(ctx, location.query);
  const directives = h('ul', { class: 'cards' });
  const log = h('div');

  const unsubDirectives = bindGame(
    ctx,
    directives,
    (s) => `${workforceKey(s)}|${DIRECTIVES.map((d) => directiveBlocker(s, ctx.system, d, target.id)).join(',')}`,
    (state) =>
      DIRECTIVES.map((d) => {
        const blocker = directiveBlocker(state, ctx.system, d, target.id);
        const done = blocker === 'Complete';
        return h(
          'li',
          { class: 'card' },
          h('h3', { class: 'card__title' }, d.title),
          h('p', { class: 'card__body' }, d.detail),
          h('p', { class: 'card__meta' }, `${d.pips} bot pip${d.pips > 1 ? 's' : ''} · ${d.days} days`),
          costList(d.cost),
          blocker ? h('p', { class: 'card__gate' }, blocker) : null,
          done
            ? null
            : button('Dispatch', {
                variant: blocker ? 'secondary' : 'primary',
                disabled: !!blocker,
                onClick: () => ctx.game.update((s) => dispatchSurvey(s, ctx.system, d.id, target.id)),
              }),
        );
      }),
  );

  const unsubLog = bindGame(
    ctx,
    log,
    (s) => String(s.log[0]?.id ?? ''),
    (state) =>
      state.log.length
        ? [
            h(
              'ul',
              { class: 'log' },
              ...state.log.map((e) =>
                h('li', { class: 'log__entry' }, h('span', { class: 'log__time' }, formatMissionTime(e.simHours)), e.text),
              ),
            ),
          ]
        : [emptyState('No reports yet', 'Survey events and discoveries will appear here.')],
  );

  const el = h(
    'div',
    { class: 'screen' },
    h(
      'p',
      { class: 'lede' },
      'Direct survey teams with directives. Findings arrive as events that need your decision.',
    ),
    siteChips(ctx, target.id, '/explore'),
    panel({ title: `Directives · ${target.name}` }, directives),
    panel({ title: 'Event log' }, log),
  );
  return {
    el,
    title: 'Explore',
    kicker: 'Survey command',
    dispose: () => {
      unsubDirectives();
      unsubLog();
    },
  };
};
