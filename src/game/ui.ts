/** View-only state that should never be part of a save file. */
export interface UiState {
  selectedBodyId: string | null;
  buildTab: 'shop' | 'active';
  /** Placeholder growth level per body for the procedural-art preview. */
  growthPreview: Record<string, number>;
  settings: {
    autoPauseOnEvents: boolean;
  };
}

export function createInitialUiState(): UiState {
  return {
    selectedBodyId: null,
    buildTab: 'shop',
    growthPreview: {},
    settings: { autoPauseOnEvents: true },
  };
}
