import type { AppContext } from '../app/context';
import { raiseEvent } from '../app/events';
import { isColonyReady } from './readiness';
import { addLog, tick } from './sim';

/** Runs the game simulation on every SimClock step. */
export function startGameLoop(ctx: AppContext): () => void {
  return ctx.clock.onTick((stepHours, snap) => {
    const result = tick(ctx.game.get(), ctx.system, stepHours, snap.simHours);
    let state = result.state;
    if (snap.simHours >= snap.arrivalHours) {
      state = addLog(
        state,
        snap.simHours,
        isColonyReady(state.readiness)
          ? 'Colonist ship has arrived. The colony is ready. Mission success.'
          : 'Colonist ship has arrived, but the colony is not ready. Mission failed.',
      );
    }
    ctx.game.update(() => state);
    const last = result.events.at(-1);
    if (last) raiseEvent(ctx, last);
  });
}
