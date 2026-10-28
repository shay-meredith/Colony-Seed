import type { ReadinessState } from './readiness';
import type { ResourceLedger } from './resources';

/**
 * Serializable game state. Slice B owns the simulation that mutates this via
 * `store.update`; time itself lives in SimClock. All starting numbers below are
 * placeholders to be tuned in Slice B.
 */
export interface GameState {
  systemId: string;
  resources: ResourceLedger;
  bots: {
    /** Bot pips: one workforce used for construction, then operation. */
    total: number;
    assigned: number;
  };
  colonists: {
    profile: string;
    count: number;
  };
  readiness: ReadinessState;
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
    bots: { total: 6, assigned: 0 },
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
