/** View-only state that should never be part of a save file. */
export interface UiState {
  selectedBodyId: string | null;
  buildTab: 'shop' | 'active';
  settings: {
    autoPauseOnEvents: boolean;
  };
}

export function createInitialUiState(): UiState {
  return {
    selectedBodyId: null,
    buildTab: 'shop',
    settings: { autoPauseOnEvents: true },
  };
}
