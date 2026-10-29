import { describe, expect, it } from 'vitest';
import { TESSALY } from '../data/system';
import {
  assignedPips,
  buildBlocker,
  directiveBlocker,
  dispatchSurvey,
  fabricateBot,
  idlePips,
  setCrew,
  setJobPips,
  startBuild,
  tick,
} from './sim';
import { getBuilding, getDirective } from './catalog';
import { createInitialGameState, type GameState } from './state';

/** Run the sim for whole days, one-hour steps. */
function runDays(state: GameState, days: number): GameState {
  let s = state;
  for (let h = 0; h < days * 24; h++) s = tick(s, TESSALY, 1, h).state;
  return s;
}

describe('bot assignment', () => {
  it('assigns pips and pays the cost when a survey is dispatched', () => {
    const s0 = createInitialGameState();
    const s1 = dispatchSurvey(s0, TESSALY, 'orbital', 'verdance');
    expect(s1.jobs).toHaveLength(1);
    expect(assignedPips(s1)).toBe(1);
    expect(idlePips(s1)).toBe(5);
    expect(s1.resources.power.amount).toBe(s0.resources.power.amount - 5);
  });

  it('frees pips and records the survey when it completes', () => {
    let s = dispatchSurvey(createInitialGameState(), TESSALY, 'orbital', 'verdance');
    s = runDays(s, 3);
    expect(s.jobs).toHaveLength(0);
    expect(idlePips(s)).toBe(6);
    expect(s.surveys.verdance).toBe(1);
    expect(s.readiness.safety.current).toBe(5);
    expect(s.log[0]?.text).toMatch(/Orbital survey sweep complete on Verdance/);
  });

  it('gates directives in order and blocks duplicates', () => {
    const s0 = createInitialGameState();
    const ground = getDirective('ground')!;
    expect(directiveBlocker(s0, TESSALY, ground, 'verdance')).toMatch(/Requires Orbital/);
    const s1 = dispatchSurvey(s0, TESSALY, 'orbital', 'verdance');
    expect(directiveBlocker(s1, TESSALY, getDirective('orbital')!, 'verdance')).toBe('In progress');
    expect(dispatchSurvey(s1, TESSALY, 'orbital', 'verdance')).toBe(s1);
    expect(directiveBlocker(s0, TESSALY, ground, 'brume')).toBe('No surface to land on');
  });

  it('lets the player move pips between jobs within the workforce', () => {
    let s = startBuild(createInitialGameState(), TESSALY, 'solar', 'verdance');
    const job = s.jobs[0]!;
    expect(job.pips).toBe(2);
    s = setJobPips(s, job.id, 10);
    expect(s.jobs[0]!.pips).toBe(6);
    expect(idlePips(s)).toBe(0);
    expect(buildBlocker(s, TESSALY, getBuilding('solar')!, 'verdance')).toBe('No idle bots');
    s = setJobPips(s, job.id, 0);
    expect(idlePips(s)).toBe(6);
    // A job with no pips makes no progress.
    expect(runDays(s, 2).jobs[0]!.progress).toBe(0);
  });

  it('builds faster with more pips and starts producing', () => {
    let s = startBuild(createInitialGameState(), TESSALY, 'solar', 'verdance');
    s = setJobPips(s, s.jobs[0]!.id, 4);
    s = runDays(s, 1);
    expect(s.buildings).toHaveLength(1);
    expect(s.resources.power.ratePerDay).toBe(8);
    const power = s.resources.power.amount;
    s = runDays(s, 1);
    expect(s.resources.power.amount).toBeCloseTo(power + 8);
  });

  it('keeps construction crew on to operate buildings that need them', () => {
    let s = dispatchSurvey(createInitialGameState(), TESSALY, 'orbital', 'cinder');
    s = runDays(s, 3);
    s = startBuild(s, TESSALY, 'extractor', 'cinder');
    s = runDays(s, 3);
    const extractor = s.buildings[0]!;
    expect(extractor.crew).toBe(1);
    expect(idlePips(s)).toBe(5);
    expect(s.resources.materials.ratePerDay).toBe(10);

    s = setCrew(s, extractor.id, 0);
    expect(idlePips(s)).toBe(6);
    expect(s.resources.materials.ratePerDay).toBe(0);
    const materials = s.resources.materials.amount;
    expect(runDays(s, 1).resources.materials.amount).toBe(materials);
    // Crew is capped by the building's slots.
    expect(setCrew(s, extractor.id, 5).buildings[0]!.crew).toBe(1);
  });

  it('unlocks Parts with a Fabricator so more bots can be made', () => {
    let s = createInitialGameState();
    s = { ...s, resources: { ...s.resources, data: { ...s.resources.data, amount: 30 } } };
    s = startBuild(s, TESSALY, 'fabricator', 'meridian');
    s = runDays(s, 5);
    expect(s.resources.parts.locked).toBe(false);
    expect(fabricateBot(s)).toBe(s);
    s = runDays(s, 6);
    s = fabricateBot(s);
    expect(s.bots.total).toBe(7);
  });
});
