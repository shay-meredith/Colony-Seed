/**
 * Pauseable-realtime simulation clock. Pure (no DOM): a driver feeds it real
 * elapsed milliseconds via `advance()`, and it emits fixed-size sim steps to
 * tick listeners. Slice B systems (production, construction, events) should
 * subscribe with `onTick` rather than owning their own timers.
 */

export const SPEEDS = [1, 2, 4] as const;
export type Speed = (typeof SPEEDS)[number];

export type PauseReason =
  | 'initial'
  | 'player'
  /** Tab hidden / Safari backgrounded. Never auto-resumes. */
  | 'hidden'
  /** Important game event (auto-pause). */
  | 'event'
  /** Colonists have arrived; the run is over. */
  | 'arrival';

export interface ClockSnapshot {
  /** Sim hours elapsed since the bots arrived in-system. */
  readonly simHours: number;
  /** Sim hour at which the colonist ship arrives (the main timer). */
  readonly arrivalHours: number;
  readonly speed: Speed;
  readonly paused: boolean;
  readonly pauseReason: PauseReason | null;
  /** Optional human-readable detail, e.g. which event caused an auto-pause. */
  readonly pauseDetail: string | null;
}

export type TickListener = (stepHours: number, snapshot: ClockSnapshot) => void;
export type ChangeListener = (snapshot: ClockSnapshot) => void;

export interface ClockOptions {
  arrivalHours: number;
  startHours?: number;
  /** Sim hours that pass per real second at 1x speed. */
  hoursPerRealSecond?: number;
  /** Fixed sim step size delivered to tick listeners. */
  stepHours?: number;
  /** Upper bound on steps processed per `advance()` call to avoid spirals. */
  maxStepsPerAdvance?: number;
}

export class SimClock {
  private simHours: number;
  private readonly arrivalHours: number;
  private readonly hoursPerRealSecond: number;
  private readonly stepHours: number;
  private readonly maxStepsPerAdvance: number;
  private accumulator = 0;
  private speed: Speed = 1;
  private paused = true;
  private pauseReason: PauseReason | null = 'initial';
  private pauseDetail: string | null = null;
  private readonly tickListeners = new Set<TickListener>();
  private readonly changeListeners = new Set<ChangeListener>();

  constructor(options: ClockOptions) {
    this.arrivalHours = options.arrivalHours;
    this.simHours = options.startHours ?? 0;
    this.hoursPerRealSecond = options.hoursPerRealSecond ?? 6;
    this.stepHours = options.stepHours ?? 1;
    this.maxStepsPerAdvance = options.maxStepsPerAdvance ?? 240;
  }

  get snapshot(): ClockSnapshot {
    return {
      simHours: this.simHours,
      arrivalHours: this.arrivalHours,
      speed: this.speed,
      paused: this.paused,
      pauseReason: this.pauseReason,
      pauseDetail: this.pauseDetail,
    };
  }

  get hasArrived(): boolean {
    return this.simHours >= this.arrivalHours;
  }

  play(): void {
    if (!this.paused || this.hasArrived) return;
    this.paused = false;
    this.pauseReason = null;
    this.pauseDetail = null;
    this.emitChange();
  }

  pause(reason: PauseReason = 'player', detail: string | null = null): void {
    if (this.paused && this.pauseReason === reason && this.pauseDetail === detail) return;
    this.paused = true;
    this.pauseReason = reason;
    this.pauseDetail = detail;
    this.accumulator = 0;
    this.emitChange();
  }

  /** Auto-pause hook for important game events (Slice B wires real events). */
  autoPause(detail: string): void {
    this.pause('event', detail);
  }

  toggle(): void {
    if (this.paused) this.play();
    else this.pause('player');
  }

  setSpeed(speed: Speed): void {
    if (this.speed === speed) return;
    this.speed = speed;
    this.emitChange();
  }

  /** Feed real elapsed time. Returns the number of sim steps processed. */
  advance(realMs: number): number {
    if (this.paused || realMs <= 0) return 0;
    this.accumulator += (realMs / 1000) * this.hoursPerRealSecond * this.speed;

    let steps = 0;
    while (this.accumulator >= this.stepHours && steps < this.maxStepsPerAdvance) {
      this.accumulator -= this.stepHours;
      this.simHours = Math.min(this.simHours + this.stepHours, this.arrivalHours);
      steps++;
      const snap = this.snapshot;
      for (const listener of this.tickListeners) listener(this.stepHours, snap);
      if (this.hasArrived) {
        this.pause('arrival', 'Colonist ship has arrived');
        return steps;
      }
      if (this.paused) break;
    }
    if (steps >= this.maxStepsPerAdvance) this.accumulator = 0;
    if (steps > 0) this.emitChange();
    return steps;
  }

  onTick(listener: TickListener): () => void {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  onChange(listener: ChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private emitChange(): void {
    const snap = this.snapshot;
    for (const listener of this.changeListeners) listener(snap);
  }
}
