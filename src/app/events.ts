import type { AppContext } from './context';

export type EventSeverity = 'info' | 'important';

/**
 * Single entry point for game events. Important events auto-pause the clock
 * (unless the player disabled it). Slice B adds an event log/queue here.
 * Returns whether the clock was paused.
 */
export function raiseEvent(ctx: AppContext, detail: string, severity: EventSeverity = 'important'): boolean {
  if (severity !== 'important' || !ctx.ui.get().settings.autoPauseOnEvents) return false;
  if (ctx.clock.snapshot.paused) return false;
  ctx.clock.autoPause(detail);
  return true;
}
