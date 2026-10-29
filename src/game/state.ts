import type { ReadinessState } from './readiness';
import type { ResourceLedger } from './resources';

/**
 * Serializable game state. `sim.ts` holds the pure actions and tick that
 * produce new versions of it; time itself lives in SimClock. All starting
 * numbers below are placeholders to be tuned.
 */
export interface GameState {
  systemId: string;
  resources: ResourceLedger;
  bots: {
    /** Bot pips: one workforce used for construction, then operation. */
    total: number;
  };
  /** Construction and survey work in progress; each holds assigned pips. */
  jobs: Job[];
  /** Completed buildings; `crew` pips operate them. */
  buildings: Building[];
  /** Survey level per body id (0 = unsurveyed). */
  surveys: Record<string, number>;
  /** Newest first. */
  log: LogEntry[];
  nextId: number;
  colonists: {
    profile: string;
    count: number;
  };
  readiness: ReadinessState;
}

export interface Job {
  id: number;
  kind: 'build' | 'survey';
  /** BuildingDef or DirectiveDef id, depending on `kind`. */
  defId: string;
  bodyId: string;
  pips: number;
  /** Total work in pip-days. */
  work: number;
  progress: number;
}

export interface Building {
  id: number;
  defId: string;
  bodyId: string;
  crew: number;
}

export interface LogEntry {
  id: number;
  simHours: number;
  text: string;
}

export const ARRIVAL_DAYS = 400;

export function createInitialGameState(): GameState {
  return {
    systemId: 'tessaly',
    resources: {
      power: { amount: 40, ratePerDay: 0, locked: false },
      materials: { amount: 120, ratePerDay: 0, locked: false },
      volatiles: { amount: 0, ratePerDay: 0, locked: false },
      biomass: { amount: 0, ratePerDay: 0, locked: false },
      data: { amount: 10, ratePerDay: 0, locked: false },
      parts: { amount: 0, ratePerDay: 0, locked: true },
    },
    bots: { total: 6 },
    jobs: [],
    buildings: [],
    surveys: {},
    log: [],
    nextId: 1,
    colonists: { profile: 'Settler cohort', count: 1200 },
    readiness: {
      safety: { current: 0, required: 60 },
      housing: { current: 0, required: 1200 },
      food: { current: 0, required: 1200 },
      jobs: { current: 0, required: 800 },
      leisure: { current: 0, required: 300 },
    },
  };
}
