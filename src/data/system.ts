/**
 * Placeholder star system for the Slice A shell. Coordinates are in map units
 * (the system map SVG viewBox spans roughly -480..480). Slice B may replace this
 * with generated or authored systems; keep the shape of `SystemBody` stable.
 */

export type BodyKind = 'star' | 'planet' | 'moon' | 'station';

export interface BodyTraits {
  gravity: string;
  atmosphere: string;
  temperature: string;
  hazard: string;
}

export interface SystemBody {
  id: string;
  name: string;
  kind: BodyKind;
  /** Parent body for moons/stations; planets orbit the star implicitly. */
  parentId?: string;
  orbitRadius: number;
  orbitAngleDeg: number;
  /** Visual radius on the system map. */
  radius: number;
  /** Base surface tint used by map and body viewer art. */
  color: string;
  /** Can host a colony (planet surface, moon domes, or station habitat). */
  habitable: boolean;
  hasAtmosphere: boolean;
  /** Gas giants have no surface: orbital surveys only, skimmers in orbit. */
  gasGiant?: boolean;
  summary: string;
  traits: BodyTraits;
}

export interface StarSystem {
  id: string;
  name: string;
  starName: string;
  starClass: string;
  bodies: readonly SystemBody[];
  /** Decorative belts drawn on the map (radius in map units). */
  belts: readonly { name: string; radius: number }[];
}

export const TESSALY: StarSystem = {
  id: 'tessaly',
  name: 'Tessaly System',
  starName: 'Tessaly',
  starClass: 'G4 V',
  belts: [{ name: 'Shale Belt', radius: 440 }],
  bodies: [
    {
      id: 'cinder',
      name: 'Cinder',
      kind: 'planet',
      orbitRadius: 120,
      orbitAngleDeg: 205,
      radius: 14,
      color: '#9a6a4a',
      habitable: false,
      hasAtmosphere: false,
      summary: 'Scorched inner world. Rich ore, lethal days.',
      traits: { gravity: '0.6 g', atmosphere: 'Trace', temperature: '+310 °C day', hazard: 'Extreme heat' },
    },
    {
      id: 'verdance',
      name: 'Verdance',
      kind: 'planet',
      orbitRadius: 245,
      orbitAngleDeg: 320,
      radius: 24,
      color: '#5f7d58',
      habitable: true,
      hasAtmosphere: true,
      summary: 'Temperate primary colony candidate.',
      traits: { gravity: '0.94 g', atmosphere: 'N₂/O₂, thin', temperature: '+11 °C mean', hazard: 'Unknown' },
    },
    {
      id: 'lantern',
      name: 'Lantern',
      kind: 'moon',
      parentId: 'verdance',
      orbitRadius: 52,
      orbitAngleDeg: 140,
      radius: 8,
      color: '#a7a396',
      habitable: true,
      hasAtmosphere: false,
      summary: 'Airless moon. Domed outpost potential.',
      traits: { gravity: '0.18 g', atmosphere: 'None', temperature: '-40 °C mean', hazard: 'Radiation' },
    },
    {
      id: 'meridian',
      name: 'SV Meridian',
      kind: 'station',
      parentId: 'verdance',
      orbitRadius: 40,
      orbitAngleDeg: 20,
      radius: 7,
      color: '#8a9599',
      habitable: true,
      hasAtmosphere: false,
      summary: 'Seed vessel in high orbit. Bot command hub.',
      traits: { gravity: 'Spin 0.3 g', atmosphere: 'Pressurised (partial)', temperature: 'Regulated', hazard: 'Hull wear' },
    },
    {
      id: 'brume',
      name: 'Brume',
      kind: 'planet',
      orbitRadius: 370,
      orbitAngleDeg: 125,
      radius: 34,
      color: '#b08a5c',
      habitable: false,
      hasAtmosphere: true,
      gasGiant: true,
      summary: 'Gas giant. Volatiles skimming target.',
      traits: { gravity: '2.3 g', atmosphere: 'H₂/He', temperature: '-120 °C cloud tops', hazard: 'Storms' },
    },
    {
      id: 'tether',
      name: 'Tether',
      kind: 'moon',
      parentId: 'brume',
      orbitRadius: 62,
      orbitAngleDeg: 300,
      radius: 9,
      color: '#c9d3d6',
      habitable: true,
      hasAtmosphere: false,
      summary: 'Ice moon. Subsurface water, cold refuge.',
      traits: { gravity: '0.12 g', atmosphere: 'None', temperature: '-170 °C mean', hazard: 'Cryo-volcanism' },
    },
  ],
};

export function getBody(system: StarSystem, id: string): SystemBody | undefined {
  return system.bodies.find((b) => b.id === id);
}

export function childrenOf(system: StarSystem, parentId: string): SystemBody[] {
  return system.bodies.filter((b) => b.parentId === parentId);
}

/** The planet plus its moons and stations, i.e. what the body viewer can switch between. */
export function familyOf(system: StarSystem, id: string): SystemBody[] {
  const body = getBody(system, id);
  if (!body) return [];
  const rootId = body.parentId ?? body.id;
  const root = getBody(system, rootId);
  return root ? [root, ...childrenOf(system, rootId)] : [];
}

/** Absolute map position (planets orbit the star at 0,0; satellites orbit their parent). */
export function mapPosition(system: StarSystem, body: SystemBody): { x: number; y: number } {
  const rad = (body.orbitAngleDeg * Math.PI) / 180;
  const local = { x: Math.cos(rad) * body.orbitRadius, y: Math.sin(rad) * body.orbitRadius };
  if (!body.parentId) return local;
  const parent = getBody(system, body.parentId);
  if (!parent) return local;
  const p = mapPosition(system, parent);
  return { x: p.x + local.x, y: p.y + local.y };
}

export const KIND_LABEL: Record<BodyKind, string> = {
  star: 'Star',
  planet: 'Planet',
  moon: 'Moon',
  station: 'Station',
};
