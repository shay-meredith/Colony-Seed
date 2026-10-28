import { clear, h } from '../core/dom';
import { familyOf, getBody, KIND_LABEL } from '../data/system';
import { renderBodyArt } from '../ui/bodyArt';
import { button, panel, statGrid } from '../ui/components';
import { notFoundScreen } from './notFound';
import type { ScreenFactory } from './types';

const MAX_PREVIEW = 24;

/**
 * Habitable body viewer: the "living result" of Build. Colonies/stations grow
 * procedurally here as buildings are placed (Slice B feeds real structures).
 */
export const bodyScreen: ScreenFactory = (ctx, args) => {
  const body = getBody(ctx.system, args.params.id ?? '');
  if (!body) return notFoundScreen(ctx, args);

  const family = familyOf(ctx.system, body.id);
  const artSlot = h('div', { class: 'body-view__art' });
  const growthValue = h('output', { class: 'stepper__value' });

  const growth = () => ctx.ui.get().growthPreview[body.id] ?? 0;
  const setGrowth = (n: number) =>
    ctx.ui.update((ui) => ({
      ...ui,
      growthPreview: { ...ui.growthPreview, [body.id]: Math.max(0, Math.min(MAX_PREVIEW, n)) },
    }));

  const renderArt = () => {
    clear(artSlot);
    artSlot.append(renderBodyArt(body, growth()));
    growthValue.textContent = String(growth());
  };

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

  const growthPanel = body.habitable
    ? panel(
        { title: 'Growth preview', tag: 'Placeholder' },
        h(
          'p',
          { class: 'muted' },
          'Structures appear procedurally as you build. This stepper fakes it until Slice B wires real buildings.',
        ),
        h(
          'div',
          { class: 'stepper' },
          button('−', { ariaLabel: 'Fewer structures', onClick: () => setGrowth(growth() - 1) }),
          growthValue,
          button('+', { ariaLabel: 'More structures', onClick: () => setGrowth(growth() + 1) }),
        ),
      )
    : null;

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
        h('span', { class: 'survey' }, 'Unsurveyed'),
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
    growthPanel,
    panel({ title: 'Structures', tag: 'Slice B' }, h('p', { class: 'muted' }, 'No structures placed yet.')),
  );

  renderArt();
  const unsub = ctx.ui.subscribe((ui, prev) => {
    if (ui.growthPreview[body.id] !== prev.growthPreview[body.id]) renderArt();
  });

  return { el, title: body.name, kicker: `Body viewer · ${KIND_LABEL[body.kind]}`, dispose: unsub };
};
