import { clear, h } from '../core/dom';
import { familyOf, getBody, KIND_LABEL } from '../data/system';
import { renderBodyArt } from '../ui/bodyArt';
import { getBuilding, SURVEY_LABEL } from '../game/catalog';
import { surveyLevel } from '../game/sim';
import { bindGame } from '../ui/assignments';
import { button, panel, statGrid } from '../ui/components';
import { notFoundScreen } from './notFound';
import type { ScreenFactory } from './types';

/**
 * Habitable body viewer: the "living result" of Build. Colonies/stations grow
 * procedurally here as buildings are placed.
 */
export const bodyScreen: ScreenFactory = (ctx, args) => {
  const body = getBody(ctx.system, args.params.id ?? '');
  if (!body) return notFoundScreen(ctx, args);

  const family = familyOf(ctx.system, body.id);
  const artSlot = h('div', { class: 'body-view__art' });
  const survey = h('span', { class: 'survey' });
  const structures = h('div');

  const switcher =
    family.length > 1
      ? h(
          'nav',
          { class: 'chips', 'aria-label': 'Bodies in this orbit' },
          ...family.map((b) =>
            h(
              'a',
              {
                class: `chip${b.id === body.id ? ' is-active' : ''}`,
                href: `#/body/${b.id}`,
                'aria-current': b.id === body.id ? 'page' : undefined,
              },
              h('span', { class: 'chip__kind' }, KIND_LABEL[b.kind]),
              b.name,
            ),
          ),
        )
      : null;

  // Structures grow procedurally from real buildings on this body.
  const unsub = bindGame(
    ctx,
    structures,
    (s) => `${surveyLevel(s, body.id)}|${s.buildings.filter((b) => b.bodyId === body.id).length}|${s.jobs.length}`,
    (state) => {
      const built = state.buildings.filter((b) => b.bodyId === body.id);
      const pending = state.jobs.filter((j) => j.kind === 'build' && j.bodyId === body.id);
      clear(artSlot);
      artSlot.append(renderBodyArt(body, built.length));
      survey.textContent = SURVEY_LABEL[surveyLevel(state, body.id)] ?? '';
      if (!built.length && !pending.length) return [h('p', { class: 'muted' }, 'No structures placed yet.')];
      return [
        h(
          'ul',
          { class: 'links' },
          ...built.map((b) => h('li', null, getBuilding(b.defId)?.name ?? b.defId)),
          ...pending.map((j) => h('li', { class: 'muted' }, `${getBuilding(j.defId)?.name ?? j.defId} (under construction)`)),
        ),
      ];
    },
  );

  const el = h(
    'div',
    { class: 'screen screen--body' },
    switcher,
    artSlot,
    panel(
      { class: 'body-view__info' },
      h(
        'p',
        { class: 'kicker' },
        body.habitable ? 'Colony candidate' : 'Resource body',
        ' · ',
        survey,
      ),
      h('p', null, body.summary),
      statGrid([
        ['Gravity', body.traits.gravity],
        ['Atmosphere', body.traits.atmosphere],
        ['Temperature', body.traits.temperature],
        ['Known hazard', body.traits.hazard],
      ]),
      h(
        'div',
        { class: 'actions' },
        button('Explore', { variant: 'primary', onClick: () => ctx.navigate(`/explore?body=${body.id}`) }),
        button('Build here', { onClick: () => ctx.navigate(`/build?body=${body.id}`) }),
      ),
    ),
    panel({ title: 'Structures' }, structures),
  );

  return { el, title: body.name, kicker: `Body viewer · ${KIND_LABEL[body.kind]}`, dispose: unsub };
};
