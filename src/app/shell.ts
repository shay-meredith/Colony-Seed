import { clear, h } from '../core/dom';
import type { ScreenInstance } from '../screens/types';
import { createDock } from '../ui/dock';
import { createHud } from '../ui/hud';
import { icon } from '../ui/icons';
import { createTimeBar } from '../ui/timeBar';
import type { AppContext } from './context';
import type { ParsedLocation } from './router';
import { resolveRoute } from './routes';

/**
 * Persistent frame: header, resource HUD, screen outlet, time bar, dock.
 * Only the outlet changes on navigation, so time and resources stay visible
 * on every screen.
 */
export function createShell(root: HTMLElement, ctx: AppContext) {
  const backBtn = h(
    'a',
    { class: 'appbar__btn appbar__back', href: '#/', 'aria-label': 'Back' },
    icon('back'),
  );
  const emblem = h('img', {
    class: 'appbar__emblem',
    src: `${import.meta.env.BASE_URL}icons/icon.svg`,
    alt: '',
    width: '36',
    height: '36',
  });
  const kicker = h('p', { class: 'appbar__kicker' });
  const title = h('h1', { class: 'appbar__title' });
  const menuBtn = h(
    'a',
    { class: 'appbar__btn appbar__menu', href: '#/menu', 'aria-label': 'Menu and settings' },
    icon('menu'),
  );
  const appbar = h(
    'header',
    { class: 'appbar' },
    backBtn,
    emblem,
    h('div', { class: 'appbar__titles' }, kicker, title),
    menuBtn,
  );

  const outlet = h('main', { class: 'outlet', id: 'main', tabindex: '-1' });
  const dock = createDock();

  root.append(appbar, createHud(ctx), outlet, createTimeBar(ctx), dock.el);

  let current: ScreenInstance | null = null;

  return {
    show(location: ParsedLocation) {
      const { route, params } = resolveRoute(location);
      current?.dispose?.();
      clear(outlet);

      current = route.screen(ctx, { params, location });
      outlet.append(current.el);
      outlet.scrollTop = 0;

      title.textContent = current.title;
      kicker.textContent = current.kicker ?? '';
      kicker.hidden = !current.kicker;
      document.title = route.id === 'system' ? 'Colony Seed' : `${current.title} · Colony Seed`;

      backBtn.hidden = !route.back;
      emblem.hidden = !!route.back;
      if (route.back) backBtn.setAttribute('href', `#${route.back}`);
      menuBtn.classList.toggle('is-active', route.id === 'menu');
      dock.setActive(route.dock);
      root.dataset.route = route.id;
    },
  };
}
