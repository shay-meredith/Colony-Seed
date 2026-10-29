import { getBody, type StarSystem, type SystemBody } from '../data/system';
import { HOURS_PER_DAY } from '../sim/time';
import {
  BOT_COST,
  DEFAULT_BUILD_PIPS,
  DIRECTIVES,
  getBuilding,
  getDirective,
  SURVEY_LABEL,
  type BuildingDef,
  type DirectiveDef,
  type ResourceAmounts,
} from './catalog';
import type { ReadinessState } from './readiness';
import { RESOURCES, type ResourceId, type ResourceLedger } from './resources';
import type { Building, GameState, Job } from './state';

/**
 * Pure game rules: every action takes a state and returns the next one (or the
 * same reference when the action isn't allowed), so screens can call them via
 * `store.update` and tests can drive them directly. No DOM, no clock.
 */

const LOG_LIMIT = 40;
/** Absorbs float drift from summing many fractional steps. */
const EPSILON = 1e-6;

export function assignedPips(state: GameState): number {
  let n = 0;
  for (const job of state.jobs) n += job.pips;
  for (const b of state.buildings) n += b.crew;
  return n;
}

export function idlePips(state: GameState): number {
  return Math.max(0, state.bots.total - assignedPips(state));
}

export function surveyLevel(state: GameState, bodyId: string): number {
  return state.surveys[bodyId] ?? 0;
}

export function canAfford(resources: ResourceLedger, cost: ResourceAmounts): boolean {
  return RESOURCES.every(({ id }) => {
    const v = cost[id] ?? 0;
    return v <= 0 || (!resources[id].locked && resources[id].amount >= v - EPSILON);
  });
}

function addResources(resources: ResourceLedger, amounts: ResourceAmounts, sign = 1): ResourceLedger {
  const next = { ...resources };
  for (const [id, v] of Object.entries(amounts) as [ResourceId, number][]) {
    next[id] = { ...next[id], amount: next[id].amount + sign * v };
  }
  return next;
}

function isSite(body: SystemBody | undefined): body is SystemBody {
  return !!body && body.kind !== 'star';
}

/** Why `def` can't be queued on `bodyId` right now, or null if it can. */
export function buildBlocker(state: GameState, system: StarSystem, def: BuildingDef, bodyId: string): string | null {
  const body = getBody(system, bodyId);
  if (!isSite(body)) return 'Pick a site';
  const req = def.requires ?? {};
  if (req.habitable && !body.habitable) return 'Needs a habitable site';
  if (req.solid && body.gasGiant) return 'Needs a solid surface';
  if (req.gasGiantOrbit) {
    const parent = body.parentId ? getBody(system, body.parentId) : undefined;
    if (!body.gasGiant && !parent?.gasGiant) return 'Gas giant orbit only';
  }
  if (req.survey && surveyLevel(state, bodyId) < req.survey) return `Requires ${SURVEY_LABEL[req.survey]}`;
  if (req.building && !state.buildings.some((b) => b.bodyId === bodyId && b.defId === req.building)) {
    return `Requires ${getBuilding(req.building)?.name ?? req.building} here`;
  }
  if (idlePips(state) < 1) return 'No idle bots';
  if (!canAfford(state.resources, def.cost)) return 'Not enough resources';
  return null;
}

/** Why `def` can't be dispatched to `bodyId` right now, or null if it can. */
export function directiveBlocker(
  state: GameState,
  system: StarSystem,
  def: DirectiveDef,
  bodyId: string,
): string | null {
  const body = getBody(system, bodyId);
  if (!isSite(body)) return 'Pick a target';
  if (def.solidOnly && body.gasGiant) return 'No surface to land on';
  const level = surveyLevel(state, bodyId);
  if (level >= def.level) return 'Complete';
  if (state.jobs.some((j) => j.kind === 'survey' && j.defId === def.id && j.bodyId === bodyId)) return 'In progress';
  if (level < def.level - 1) {
    const prev = DIRECTIVES.find((d) => d.level === def.level - 1);
    return `Requires ${prev?.title ?? SURVEY_LABEL[def.level - 1]}`;
  }
  if (idlePips(state) < def.pips) return `Needs ${def.pips} idle bot${def.pips > 1 ? 's' : ''}`;
  if (!canAfford(state.resources, def.cost)) return 'Not enough resources';
  return null;
}

export function botBlocker(state: GameState): string | null {
  if (state.resources.parts.locked) return 'Needs Parts (build a Fabricator)';
  if (!canAfford(state.resources, BOT_COST)) return 'Not enough resources';
  return null;
}

export function addLog(state: GameState, simHours: number, text: string): GameState {
  const entry = { id: state.nextId, simHours, text };
  return { ...state, nextId: state.nextId + 1, log: [entry, ...state.log].slice(0, LOG_LIMIT) };
}

function newJob(state: GameState, job: Omit<Job, 'id' | 'progress'>): GameState {
  return { ...state, nextId: state.nextId + 1, jobs: [...state.jobs, { ...job, id: state.nextId, progress: 0 }] };
}

export function startBuild(state: GameState, system: StarSystem, defId: string, bodyId: string): GameState {
  const def = getBuilding(defId);
  if (!def || buildBlocker(state, system, def, bodyId)) return state;
  const paid = { ...state, resources: addResources(state.resources, def.cost, -1) };
  return newJob(paid, {
    kind: 'build',
    defId,
    bodyId,
    pips: Math.min(idlePips(state), DEFAULT_BUILD_PIPS),
    work: def.botDays,
  });
}

export function dispatchSurvey(state: GameState, system: StarSystem, directiveId: string, bodyId: string): GameState {
  const def = getDirective(directiveId);
  if (!def || directiveBlocker(state, system, def, bodyId)) return state;
  const paid = { ...state, resources: addResources(state.resources, def.cost, -1) };
  return newJob(paid, { kind: 'survey', defId: directiveId, bodyId, pips: def.pips, work: def.pips * def.days });
}

/** Reassign pips on a job. Clamped to what's idle; 0 pauses the job. */
export function setJobPips(state: GameState, jobId: number, pips: number): GameState {
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) return state;
  const next = Math.max(0, Math.min(Math.floor(pips), job.pips + idlePips(state)));
  if (next === job.pips) return state;
  return { ...state, jobs: state.jobs.map((j) => (j.id === jobId ? { ...j, pips: next } : j)) };
}

/** Reassign operating crew on a building. Clamped to its crew slots and idle pips. */
export function setCrew(state: GameState, buildingId: number, crew: number): GameState {
  const building = state.buildings.find((b) => b.id === buildingId);
  const def = building && getBuilding(building.defId);
  if (!building || !def) return state;
  const next = Math.max(0, Math.min(Math.floor(crew), def.crew, building.crew + idlePips(state)));
  if (next === building.crew) return state;
  return refresh({ ...state, buildings: state.buildings.map((b) => (b.id === buildingId ? { ...b, crew: next } : b)) });
}

export function fabricateBot(state: GameState): GameState {
  if (botBlocker(state)) return state;
  return {
    ...state,
    resources: addResources(state.resources, BOT_COST, -1),
    bots: { ...state.bots, total: state.bots.total + 1 },
  };
}

function crewFraction(def: BuildingDef, b: Building): number {
  return def.crew === 0 ? 1 : b.crew / def.crew;
}

/** Recompute derived fields: projected rates and readiness. */
export function refresh(state: GameState): GameState {
  const rates: Partial<Record<ResourceId, number>> = {};
  const capacity: Partial<Record<keyof ReadinessState, number>> = {};
  for (const b of state.buildings) {
    const def = getBuilding(b.defId);
    if (!def) continue;
    const frac = crewFraction(def, b);
    for (const [id, v] of Object.entries(def.perDay) as [ResourceId, number][]) rates[id] = (rates[id] ?? 0) + v * frac;
    for (const [axis, v] of Object.entries(def.readiness) as [keyof ReadinessState, number][]) {
      capacity[axis] = (capacity[axis] ?? 0) + v;
    }
  }
  let safety = 0;
  for (const level of Object.values(state.surveys)) {
    for (const d of DIRECTIVES) if (d.level <= level) safety += d.safety;
  }
  capacity.safety = safety;

  const resources = { ...state.resources };
  for (const { id } of RESOURCES) {
    const rate = Math.round((rates[id] ?? 0) * 10) / 10;
    if (resources[id].ratePerDay !== rate) resources[id] = { ...resources[id], ratePerDay: rate };
  }
  const readiness = { ...state.readiness };
  for (const axis of Object.keys(readiness) as (keyof ReadinessState)[]) {
    readiness[axis] = { ...readiness[axis], current: capacity[axis] ?? 0 };
  }
  return { ...state, resources, readiness };
}

export interface TickResult {
  state: GameState;
  /** Notable completions, for the event log / auto-pause. */
  events: string[];
}

/** Advance the simulation by one clock step. */
export function tick(state: GameState, system: StarSystem, stepHours: number, simHours: number): TickResult {
  const days = stepHours / HOURS_PER_DAY;
  const events: string[] = [];
  let next = state;

  // Production first, so a building finished this step starts next step.
  let resources = next.resources;
  for (const b of next.buildings) {
    const def = getBuilding(b.defId);
    if (!def) continue;
    const scale = crewFraction(def, b) * days;
    if (scale <= 0) continue;
    const delta: ResourceAmounts = {};
    let stalled = false;
    for (const [id, v] of Object.entries(def.perDay) as [ResourceId, number][]) {
      if (resources[id].locked) continue;
      if (v < 0 && resources[id].amount < -v * scale - EPSILON) stalled = true;
      delta[id] = v * scale;
    }
    if (!stalled) resources = addResources(resources, delta);
  }
  if (resources !== next.resources) next = { ...next, resources };

  // Work on jobs.
  const done: Job[] = [];
  const jobs = next.jobs.map((job) => {
    if (job.pips <= 0) return job;
    let progress = job.progress + job.pips * days;
    if (progress >= job.work - EPSILON) progress = job.work;
    const updated = { ...job, progress };
    if (progress >= job.work) done.push(updated);
    return updated;
  });
  if (jobs.some((j, i) => j !== next.jobs[i])) next = { ...next, jobs: jobs.filter((j) => !done.includes(j)) };

  for (const job of done) {
    const bodyName = getBody(system, job.bodyId)?.name ?? job.bodyId;
    let text: string;
    if (job.kind === 'build') {
      const def = getBuilding(job.defId);
      if (!def) continue;
      // Construction crews stay on to operate the building where it needs them.
      const crew = Math.min(def.crew, job.pips);
      next = { ...next, nextId: next.nextId + 1, buildings: [...next.buildings, { id: next.nextId, defId: def.id, bodyId: job.bodyId, crew }] };
      if (def.unlocks && next.resources[def.unlocks].locked) {
        next = { ...next, resources: { ...next.resources, [def.unlocks]: { ...next.resources[def.unlocks], locked: false } } };
      }
      const freed = job.pips - crew;
      text = `${def.name} complete on ${bodyName}.${freed > 0 ? ` ${freed} bot${freed > 1 ? 's' : ''} now idle.` : ''}`;
    } else {
      const def = getDirective(job.defId);
      if (!def) continue;
      next = {
        ...next,
        surveys: { ...next.surveys, [job.bodyId]: Math.max(surveyLevel(next, job.bodyId), def.level) },
        resources: addResources(next.resources, def.reward),
      };
      text = `${def.title} complete on ${bodyName}. ${job.pips} bot${job.pips > 1 ? 's' : ''} now idle.`;
    }
    next = addLog(next, simHours, text);
    events.push(text);
  }
  if (done.length) next = refresh(next);

  return { state: next, events };
}
