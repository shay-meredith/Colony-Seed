import { h } from '../core/dom';
import { BOT_COST } from '../game/catalog';
import { assignedPips, botBlocker, fabricateBot, idlePips } from '../game/sim';
import { bindGame, crewRow, jobRow, workforceKey } from '../ui/assignments';
import { button, costList, emptyState, panel, statGrid } from '../ui/components';
import type { ScreenFactory } from './types';

/** Bot pips: one workforce, used first for construction then for operation. */
export const botsScreen: ScreenFactory = (ctx) => {
  const workforce = h('div');
  const assignments = h('div');

  const unsubWorkforce = bindGame(
    ctx,
    workforce,
    (s) => `${workforceKey(s)}|${botBlocker(s)}`,
    (state) => {
      const total = state.bots.total;
      const assigned = assignedPips(state);
      const blocker = botBlocker(state);
      const pips = Array.from({ length: total }, (_, i) =>
        h('li', { class: `pip${i < assigned ? ' is-assigned' : ''}`, 'aria-hidden': 'true' }),
      );
      return [
        h('ul', { class: 'pips', 'aria-label': `${assigned} of ${total} bot pips assigned` }, ...pips),
        statGrid([
          ['Total pips', String(total)],
          ['Assigned', String(assigned)],
          ['Idle', String(idlePips(state))],
        ]),
        h(
          'div',
          { class: 'actions' },
          button('Fabricate bot', {
            disabled: !!blocker,
            onClick: () => ctx.game.update(fabricateBot),
          }),
        ),
        costList(BOT_COST),
        blocker ? h('p', { class: 'card__gate' }, blocker) : null,
      ];
    },
  );

  const unsubAssignments = bindGame(ctx, assignments, workforceKey, (state) => {
    const rows = [
      ...state.jobs.map((job) => jobRow(ctx, state, job)),
      ...state.buildings.map((b) => crewRow(ctx, state, b)).filter((r): r is HTMLElement => !!r),
    ];
    if (rows.length) return [h('ul', { class: 'assigns' }, ...rows)];
    return [
      emptyState('All bots idle', 'Dispatch surveys from Explore or queue construction from Build, then tune pips here.'),
      h(
        'div',
        { class: 'actions' },
        button('Explore', { variant: 'primary', onClick: () => ctx.navigate('/explore') }),
        button('Build', { onClick: () => ctx.navigate('/build') }),
      ),
    ];
  });

  const el = h(
    'div',
    { class: 'screen' },
    panel({ title: 'Workforce' }, workforce),
    panel({ title: 'Assignments' }, assignments),
  );
  return {
    el,
    title: 'Bots',
    kicker: 'Workforce',
    dispose: () => {
      unsubWorkforce();
      unsubAssignments();
    },
  };
};
