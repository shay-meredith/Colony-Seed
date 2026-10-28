import type { SimClock } from './clock';

/** Clamp per-frame real time so a stalled frame can't fast-forward the sim. */
const MAX_FRAME_MS = 250;

/**
 * Drives a SimClock from requestAnimationFrame and enforces the hard-pause
 * rule: whenever the page is hidden (tab switch, Safari backgrounded, phone
 * locked, PWA swiped away) the clock pauses with reason `hidden` and stays
 * paused until the player resumes it.
 */
export function startClockDriver(clock: SimClock): () => void {
  let last: number | null = null;
  let frame = 0;

  const loop = (now: number) => {
    if (last !== null) clock.advance(Math.min(now - last, MAX_FRAME_MS));
    last = now;
    frame = requestAnimationFrame(loop);
  };

  const hardPause = () => {
    last = null;
    if (!clock.snapshot.paused) clock.pause('hidden', 'App was backgrounded');
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') hardPause();
    else last = null;
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', hardPause);
  document.addEventListener('freeze', hardPause);
  frame = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', hardPause);
    document.removeEventListener('freeze', hardPause);
  };
}
