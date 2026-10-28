import { h } from '../core/dom';
import type { DockId } from '../app/routes';
import { icon, type IconName } from './icons';

const ITEMS: { id: DockId; label: string; path: string; icon: IconName }[] = [
  { id: 'map', label: 'System', path: '/', icon: 'map' },
  { id: 'explore', label: 'Explore', path: '/explore', icon: 'explore' },
  { id: 'build', label: 'Build', path: '/build', icon: 'build' },
  { id: 'bots', label: 'Bots', path: '/bots', icon: 'bots' },
  { id: 'policy', label: 'Policy', path: '/policy', icon: 'policy' },
];

/** Bottom dock: jumps between full screens (these are screens, not map lenses). */
export function createDock(): { el: HTMLElement; setActive(id: DockId | undefined): void } {
  const links = ITEMS.map((item) =>
    h(
      'a',
      { class: 'dock__link', href: `#${item.path}`, dataset: { dock: item.id } },
      icon(item.icon),
      h('span', { class: 'dock__label' }, item.label),
    ),
  );
  const el = h('nav', { class: 'dock', 'aria-label': 'Primary' }, ...links);
  return {
    el,
    setActive(id) {
      for (const link of links) {
        const active = link.dataset.dock === id;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    },
  };
}
