import type { AppContext } from '../app/context';
import type { ParsedLocation } from '../app/router';

export interface ScreenInstance {
  el: HTMLElement;
  title: string;
  /** Small stencil line above the title, e.g. "Body viewer". */
  kicker?: string;
  /** Called when navigating away: unsubscribe listeners here. */
  dispose?(): void;
}

export interface ScreenArgs {
  params: Record<string, string>;
  location: ParsedLocation;
}

export type ScreenFactory = (ctx: AppContext, args: ScreenArgs) => ScreenInstance;
