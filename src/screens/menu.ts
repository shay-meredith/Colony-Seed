import { raiseEvent } from '../app/events';
import { h } from '../core/dom';
import { button, panel, statGrid } from '../ui/components';
import type { ScreenFactory } from './types';

const REPO = 'https://github.com/shay-meredith/Colony-Seed';

export const menuScreen: ScreenFactory = (ctx) => {
  const autoPause = h('input', {
    type: 'checkbox',
    class: 'switch__input',
    checked: ctx.ui.get().settings.autoPauseOnEvents,
    onChange: (e: Event) => {
      const on = (e.target as HTMLInputElement).checked;
      ctx.ui.update((ui) => ({ ...ui, settings: { ...ui.settings, autoPauseOnEvents: on } }));
    },
  });

  const testStatus = h('p', { class: 'muted', 'aria-live': 'polite' });

  const el = h(
    'div',
    { class: 'screen' },
    panel(
      { title: 'Time' },
      h(
        'label',
        { class: 'switch' },
        h('span', { class: 'switch__text' }, 'Auto-pause on important events'),
        autoPause,
      ),
      h('p', { class: 'muted' }, 'Time always hard-pauses when the app is backgrounded or the tab is hidden.'),
      button('Fire test event', {
        onClick: () => {
          const paused = raiseEvent(ctx, 'Test signal received');
          testStatus.textContent = paused
            ? 'Clock auto-paused.'
            : ctx.clock.snapshot.paused
              ? 'Clock already paused. Press play first.'
              : 'Auto-pause is off; event ignored.';
        },
      }),
      testStatus,
    ),
    panel(
      { title: 'Game', tag: 'Slice B' },
      h('div', { class: 'actions' }, button('New game', { disabled: true }), button('Save', { disabled: true })),
    ),
    panel(
      { title: 'About' },
      statGrid([
        ['Build', `v${__APP_VERSION__} · Slice A scaffold`],
        ['System', ctx.system.name],
      ]),
      h(
        'ul',
        { class: 'links' },
        h('li', null, h('a', { href: `${REPO}/blob/main/docs/DESIGN_CONTEXT.md`, target: '_blank', rel: 'noopener' }, 'Design context')),
        h('li', null, h('a', { href: REPO, target: '_blank', rel: 'noopener' }, 'Source on GitHub')),
      ),
    ),
  );
  return { el, title: 'Menu', kicker: 'Settings' };
};
