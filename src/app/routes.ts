import { bodyScreen } from '../screens/body';
import { botsScreen } from '../screens/bots';
import { buildScreen } from '../screens/build';
import { exploreScreen } from '../screens/explore';
import { menuScreen } from '../screens/menu';
import { notFoundScreen } from '../screens/notFound';
import { policyScreen } from '../screens/policy';
import { systemMapScreen } from '../screens/systemMap';
import type { ScreenFactory } from '../screens/types';
import { matchPattern, type ParsedLocation } from './router';

export type DockId = 'map' | 'explore' | 'build' | 'bots' | 'policy';

export interface RouteDef {
  id: string;
  pattern: string;
  screen: ScreenFactory;
  /** Where the header back button goes. Omitted on the home screen. */
  back?: string;
  /** Which dock item to highlight. */
  dock?: DockId;
}

/**
 * Navigation model (locked 2026-10-26): the solar system map is home; bodies
 * open a dedicated viewer; Explore/Build/Bots/Policy/Menu are full screens.
 */
export const ROUTES: readonly RouteDef[] = [
  { id: 'system', pattern: '/', screen: systemMapScreen, dock: 'map' },
  { id: 'body', pattern: '/body/:id', screen: bodyScreen, back: '/', dock: 'map' },
  { id: 'explore', pattern: '/explore', screen: exploreScreen, back: '/', dock: 'explore' },
  { id: 'build', pattern: '/build', screen: buildScreen, back: '/', dock: 'build' },
  { id: 'bots', pattern: '/bots', screen: botsScreen, back: '/', dock: 'bots' },
  { id: 'policy', pattern: '/policy', screen: policyScreen, back: '/', dock: 'policy' },
  { id: 'menu', pattern: '/menu', screen: menuScreen, back: '/' },
];

const NOT_FOUND: RouteDef = { id: 'not-found', pattern: '*', screen: notFoundScreen, back: '/' };

export function resolveRoute(location: ParsedLocation): { route: RouteDef; params: Record<string, string> } {
  for (const route of ROUTES) {
    const params = matchPattern(route.pattern, location.path);
    if (params) return { route, params };
  }
  return { route: NOT_FOUND, params: {} };
}
