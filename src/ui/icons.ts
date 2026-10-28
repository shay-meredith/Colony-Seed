import { s } from '../core/dom';

/** 24×24 stroke icons drawn in an angular, stencil-like style. */
const PATHS = {
  map: 'M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z M3 12a9 4.5 0 1 0 18 0a9 4.5 0 1 0-18 0 M18.5 6.5l1.5-1.5',
  explore: 'M12 3v3 M12 18v3 M3 12h3 M18 12h3 M12 7l5 5-5 5-5-5Z M12 12l3-3',
  build: 'M4 20h16 M6 20V10l6-5 6 5v10 M10 20v-5h4v5 M2 10h4 M18 10h4',
  bots: 'M7 8h10l2 3v6l-2 2H7l-2-2v-6Z M9 13h.01 M15 13h.01 M12 4v4 M10 4h4 M9 16h6',
  policy: 'M6 3h9l3 3v15H6Z M9 9h6 M9 13h6 M9 17h4',
  menu: 'M4 7h16 M4 12h16 M4 17h10',
  back: 'M15 5l-7 7 7 7',
  play: 'M8 5l11 7-11 7Z',
  pause: 'M7 5h3v14H7Z M14 5h3v14h-3Z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v9H5Z',
} as const;

export type IconName = keyof typeof PATHS;

export function icon(name: IconName, className = 'icon'): SVGSVGElement {
  return s(
    'svg',
    {
      class: className,
      viewBox: '0 0 24 24',
      width: '24',
      height: '24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.8',
      'stroke-linecap': 'square',
      'stroke-linejoin': 'miter',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    s('path', { d: PATHS[name] }),
  );
}
