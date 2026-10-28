import { h } from '../core/dom';
import { RESOURCES, type ResourceId } from '../game/resources';

type Child = Node | string | false | null | undefined;

export function panel(
  opts: { title?: string; tag?: string; class?: string },
  ...children: Child[]
): HTMLElement {
  return h(
    'section',
    { class: `panel ${opts.class ?? ''}`.trim() },
    opts.title || opts.tag
      ? h(
          'header',
          { class: 'panel__head' },
          opts.title ? h('h2', { class: 'panel__title' }, opts.title) : null,
          opts.tag ? stubTag(opts.tag) : null,
        )
      : null,
    ...children,
  );
}

export function button(
  label: string,
  opts: {
    variant?: 'primary' | 'secondary' | 'ghost';
    onClick?: () => void;
    disabled?: boolean;
    class?: string;
    ariaLabel?: string;
    pressed?: boolean;
  } = {},
): HTMLButtonElement {
  const variant = opts.variant ?? 'secondary';
  return h(
    'button',
    {
      type: 'button',
      class: `btn btn--${variant} ${opts.class ?? ''}`.trim(),
      disabled: opts.disabled,
      'aria-label': opts.ariaLabel,
      'aria-pressed': opts.pressed === undefined ? undefined : String(opts.pressed),
      onClick: opts.onClick,
    },
    label,
  );
}

/** Marks placeholder UI so it's obvious what Slice B must fill in. */
export function stubTag(text = 'Slice B'): HTMLElement {
  return h('span', { class: 'tag tag--stub' }, text);
}

export function emptyState(title: string, body: string): HTMLElement {
  return h('div', { class: 'empty' }, h('p', { class: 'empty__title' }, title), h('p', { class: 'empty__body' }, body));
}

export function meter(ratio: number, label?: string): HTMLElement {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return h(
    'div',
    {
      class: 'meter',
      role: 'meter',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': String(pct),
      'aria-label': label,
    },
    h('div', { class: 'meter__fill', style: `width:${pct}%` }),
  );
}

export type Cost = Partial<Record<ResourceId, number>> & { botDays?: number };

export function costList(cost: Cost): HTMLElement {
  const items: HTMLElement[] = [];
  for (const def of RESOURCES) {
    const v = cost[def.id];
    if (v) items.push(h('li', { class: `cost cost--${def.id}` }, h('b', null, def.code), ` ${v}`));
  }
  if (cost.botDays) items.push(h('li', { class: 'cost cost--bots' }, h('b', null, 'BOT'), ` ${cost.botDays} pip·d`));
  return h('ul', { class: 'costs', 'aria-label': 'Cost' }, ...items);
}

export function statGrid(rows: [string, string][]): HTMLElement {
  return h(
    'dl',
    { class: 'stats' },
    ...rows.flatMap(([k, v]) => [h('dt', null, k), h('dd', null, v)]),
  );
}
