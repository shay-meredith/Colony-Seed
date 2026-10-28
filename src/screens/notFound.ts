import { h } from '../core/dom';
import { button, emptyState } from '../ui/components';
import type { ScreenFactory } from './types';

export const notFoundScreen: ScreenFactory = (ctx) => ({
  el: h(
    'div',
    { class: 'screen' },
    emptyState('No signal', 'That location is not on the system charts.'),
    button('Return to system map', { variant: 'primary', onClick: () => ctx.navigate('/') }),
  ),
  title: 'Not found',
});
