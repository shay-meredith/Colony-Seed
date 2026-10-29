import type { ReadinessAxis } from './readiness';
import type { ResourceId } from './resources';

export type ResourceAmounts = Partial<Record<ResourceId, number>>;

/** What a site needs before a building can be queued there. */
export interface BuildingRequirements {
  /** Minimum survey level on the site (1 orbital, 2 ground, 3 deep core). */
  survey?: number;
  /** Another building that must already stand on the same site. */
  building?: string;
  habitable?: boolean;
  /** Site must be a gas giant or one of its satellites. */
  gasGiantOrbit?: boolean;
  /** Site must have a surface (not a gas giant). */
  solid?: boolean;
}

export interface BuildingDef {
  id: string;
  name: string;
  effect: string;
  cost: ResourceAmounts;
  /** Construction work in pip-days. */
  botDays: number;
  /** Pips needed to run at full output; 0 means it runs unattended. */
  crew: number;
  /** Net resource change per sim day at full crew. Negative values are upkeep. */
  perDay: ResourceAmounts;
  /** Readiness capacity the building provides once built. */
  readiness: Partial<Record<ReadinessAxis, number>>;
  requires?: BuildingRequirements;
  /** Resources this building unlocks on completion. */
  unlocks?: ResourceId;
}

/** All numbers are placeholders to be tuned. */
export const BUILDINGS: readonly BuildingDef[] = [
  {
    id: 'solar',
    name: 'Solar array',
    effect: '+8 Power/day',
    cost: { materials: 30 },
    botDays: 4,
    crew: 0,
    perDay: { power: 8 },
    readiness: { jobs: 10 },
  },
  {
    id: 'extractor',
    name: 'Ore extractor',
    effect: '+10 Materials/day · crew 1',
    cost: { materials: 40 },
    botDays: 5,
    crew: 1,
    perDay: { materials: 10, power: -2 },
    readiness: { jobs: 40 },
    requires: { survey: 1, solid: true },
  },
  {
    id: 'habitat',
    name: 'Habitat module',
    effect: '+100 Housing',
    cost: { materials: 80, power: 10 },
    botDays: 8,
    crew: 0,
    perDay: { power: -1 },
    readiness: { housing: 100 },
    requires: { survey: 2, habitable: true },
  },
  {
    id: 'hydroponics',
    name: 'Hydroponics bay',
    effect: '+150 Food capacity · crew 1',
    cost: { materials: 40, volatiles: 20 },
    botDays: 6,
    crew: 1,
    perDay: { biomass: 4, power: -2 },
    readiness: { food: 150, jobs: 40 },
    requires: { building: 'habitat' },
  },
  {
    id: 'commons',
    name: 'Commons dome',
    effect: '+60 Leisure',
    cost: { materials: 50, power: 5 },
    botDays: 6,
    crew: 0,
    perDay: {},
    readiness: { leisure: 60, jobs: 30 },
    requires: { building: 'habitat' },
  },
  {
    id: 'fabricator',
    name: 'Fabricator',
    effect: 'Unlocks Parts · +2 Parts/day · crew 1',
    cost: { materials: 60, power: 20, data: 20 },
    botDays: 10,
    crew: 1,
    perDay: { parts: 2, power: -3 },
    readiness: { jobs: 60 },
    unlocks: 'parts',
  },
  {
    id: 'skimmer',
    name: 'Volatiles skimmer',
    effect: '+6 Volatiles/day · crew 1',
    cost: { materials: 90 },
    botDays: 12,
    crew: 1,
    perDay: { volatiles: 6, power: -1 },
    readiness: { jobs: 30 },
    requires: { gasGiantOrbit: true },
  },
];

export interface DirectiveDef {
  id: string;
  title: string;
  detail: string;
  /** Survey level the site reaches when this completes; needs level - 1 first. */
  level: number;
  pips: number;
  days: number;
  cost: ResourceAmounts;
  reward: ResourceAmounts;
  /** Safety score contributed once complete. */
  safety: number;
  /** Not possible on gas giants. */
  solidOnly?: boolean;
}

export const DIRECTIVES: readonly DirectiveDef[] = [
  {
    id: 'orbital',
    title: 'Orbital survey sweep',
    detail: 'Map terrain, hazards and resource hints from orbit.',
    level: 1,
    pips: 1,
    days: 3,
    cost: { power: 5 },
    reward: { data: 5 },
    safety: 5,
  },
  {
    id: 'ground',
    title: 'Ground survey: landing zone',
    detail: 'Send bots down to confirm a safe colony site.',
    level: 2,
    pips: 2,
    days: 6,
    cost: { power: 10 },
    reward: { data: 5 },
    safety: 10,
    solidOnly: true,
  },
  {
    id: 'deep',
    title: 'Deep core sample',
    detail: 'Look for ore, water and geothermal potential.',
    level: 3,
    pips: 2,
    days: 10,
    cost: { power: 15, materials: 10 },
    reward: { materials: 40, data: 10 },
    safety: 5,
    solidOnly: true,
  },
];

export const SURVEY_LABEL = ['Unsurveyed', 'Orbital survey', 'Ground survey', 'Deep survey'] as const;

export const BOT_COST: ResourceAmounts = { parts: 10, materials: 20 };

/** Pips a new construction job takes by default (if that many are idle). */
export const DEFAULT_BUILD_PIPS = 2;

export function getBuilding(id: string): BuildingDef | undefined {
  return BUILDINGS.find((b) => b.id === id);
}

export function getDirective(id: string): DirectiveDef | undefined {
  return DIRECTIVES.find((d) => d.id === id);
}
