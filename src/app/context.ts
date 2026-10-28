import { createStore, type Store } from '../core/store';
import { TESSALY, type StarSystem } from '../data/system';
import { ARRIVAL_DAYS, createInitialGameState, type GameState } from '../game/state';
import { createInitialUiState, type UiState } from '../game/ui';
import { SimClock } from '../sim/clock';
import { HOURS_PER_DAY } from '../sim/time';

/** Everything a screen or widget may depend on. Passed explicitly, no globals. */
export interface AppContext {
  system: StarSystem;
  game: Store<GameState>;
  ui: Store<UiState>;
  clock: SimClock;
  navigate(path: string): void;
}

export function createAppContext(navigate: (path: string) => void): AppContext {
  return {
    system: TESSALY,
    game: createStore(createInitialGameState()),
    ui: createStore(createInitialUiState()),
    clock: new SimClock({ arrivalHours: ARRIVAL_DAYS * HOURS_PER_DAY }),
    navigate,
  };
}
