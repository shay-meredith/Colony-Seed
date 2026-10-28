import { describe, expect, it, vi } from 'vitest';
import { SimClock } from './clock';
import { formatCountdown, formatMissionTime } from './time';

const make = () => new SimClock({ arrivalHours: 48, hoursPerRealSecond: 6, stepHours: 1 });

describe('SimClock', () => {
  it('starts paused and ignores time until played', () => {
    const clock = make();
    expect(clock.snapshot.paused).toBe(true);
    expect(clock.snapshot.pauseReason).toBe('initial');
    expect(clock.advance(1000)).toBe(0);
    expect(clock.snapshot.simHours).toBe(0);
  });

  it('emits fixed steps scaled by speed', () => {
    const clock = make();
    const tick = vi.fn();
    clock.onTick(tick);
    clock.play();
    clock.advance(1000);
    expect(clock.snapshot.simHours).toBe(6);
    clock.setSpeed(4);
    clock.advance(500);
    expect(clock.snapshot.simHours).toBe(18);
    expect(tick).toHaveBeenCalledTimes(18);
  });

  it('carries fractional time between advances', () => {
    const clock = make();
    clock.play();
    clock.advance(100);
    clock.advance(100);
    expect(clock.snapshot.simHours).toBe(1);
  });

  it('auto-pauses mid-advance when a tick listener raises an event', () => {
    const clock = make();
    clock.onTick((_, snap) => {
      if (snap.simHours === 3) clock.autoPause('Dust storm detected');
    });
    clock.play();
    clock.advance(10_000);
    expect(clock.snapshot.simHours).toBe(3);
    expect(clock.snapshot.pauseReason).toBe('event');
    expect(clock.snapshot.pauseDetail).toBe('Dust storm detected');
  });

  it('stops at arrival and refuses to resume', () => {
    const clock = make();
    clock.play();
    clock.setSpeed(4);
    clock.advance(60_000);
    expect(clock.snapshot.simHours).toBe(48);
    expect(clock.snapshot.pauseReason).toBe('arrival');
    clock.play();
    expect(clock.snapshot.paused).toBe(true);
  });

  it('hidden pause stays paused until the player resumes', () => {
    const clock = make();
    clock.play();
    clock.pause('hidden');
    clock.advance(1000);
    expect(clock.snapshot.simHours).toBe(0);
    clock.play();
    clock.advance(1000);
    expect(clock.snapshot.simHours).toBe(6);
  });
});

describe('time formatting', () => {
  it('formats mission time and countdown', () => {
    expect(formatMissionTime(0)).toBe('Day 1 · 00:00');
    expect(formatMissionTime(30)).toBe('Day 2 · 06:00');
    expect(formatCountdown(24 * 412 + 6)).toBe('T-412d 06h');
    expect(formatCountdown(-5)).toBe('T-0d 00h');
  });
});
