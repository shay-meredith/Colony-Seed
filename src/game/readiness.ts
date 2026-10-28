export type ReadinessAxis = 'safety' | 'housing' | 'food' | 'jobs' | 'leisure';

export interface ReadinessDef {
  id: ReadinessAxis;
  label: string;
  unit: string;
}

export const READINESS: readonly ReadinessDef[] = [
  { id: 'safety', label: 'Safety', unit: 'score' },
  { id: 'housing', label: 'Housing', unit: 'beds' },
  { id: 'food', label: 'Food capacity', unit: 'rations/day' },
  { id: 'jobs', label: 'Jobs', unit: 'posts' },
  { id: 'leisure', label: 'Leisure', unit: 'slots' },
];

export interface ReadinessValue {
  current: number;
  /** Threshold set by the incoming colonist profile for this system. */
  required: number;
}

export type ReadinessState = Record<ReadinessAxis, ReadinessValue>;

export function readinessRatio(value: ReadinessValue): number {
  if (value.required <= 0) return 1;
  return Math.min(1, value.current / value.required);
}

/** Main failure condition: any axis below threshold when colonists arrive. */
export function isColonyReady(state: ReadinessState): boolean {
  return Object.values(state).every((v) => v.current >= v.required);
}
