export const HOURS_PER_DAY = 24;

/** "Day 12 · 06:00" style mission clock. */
export function formatMissionTime(simHours: number): string {
  const day = Math.floor(simHours / HOURS_PER_DAY) + 1;
  const hour = Math.floor(simHours % HOURS_PER_DAY);
  return `Day ${day} · ${String(hour).padStart(2, '0')}:00`;
}

/** "T-412d 06h" countdown to colonist arrival. */
export function formatCountdown(remainingHours: number): string {
  const clamped = Math.max(0, Math.ceil(remainingHours));
  const days = Math.floor(clamped / HOURS_PER_DAY);
  const hours = clamped % HOURS_PER_DAY;
  return `T-${days}d ${String(hours).padStart(2, '0')}h`;
}
