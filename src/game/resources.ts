export type ResourceId = 'power' | 'materials' | 'volatiles' | 'biomass' | 'data' | 'parts';

export interface ResourceDef {
  id: ResourceId;
  label: string;
  /** Three-letter HUD code. */
  code: string;
  /** Portion carried to the next system (small hold), per design context. */
  carriesOver: boolean;
  /** Parts is an optional bucket and may start locked. */
  optional?: boolean;
  blurb: string;
}

export const RESOURCES: readonly ResourceDef[] = [
  { id: 'power', label: 'Power', code: 'PWR', carriesOver: false, blurb: 'Generated and consumed locally.' },
  { id: 'materials', label: 'Materials', code: 'MAT', carriesOver: true, blurb: 'Structural stock for construction.' },
  { id: 'volatiles', label: 'Volatiles', code: 'VOL', carriesOver: false, blurb: 'Water, gases, fuels.' },
  { id: 'biomass', label: 'Biomass', code: 'BIO', carriesOver: false, blurb: 'Foodstock and organics.' },
  { id: 'data', label: 'Data', code: 'DAT', carriesOver: true, blurb: 'Survey results and research.' },
  {
    id: 'parts',
    label: 'Parts',
    code: 'PRT',
    carriesOver: true,
    optional: true,
    blurb: 'Bot builds, repairs, high-tech.',
  },
];

export interface ResourceStock {
  amount: number;
  /** Net change per sim day; Slice B computes this from buildings. */
  ratePerDay: number;
  locked: boolean;
}

export type ResourceLedger = Record<ResourceId, ResourceStock>;
