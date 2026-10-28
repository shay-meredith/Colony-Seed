import { describe, expect, it } from 'vitest';
import { matchPattern, parseHash } from './router';
import { resolveRoute } from './routes';

describe('router', () => {
  it('parses hashes with queries', () => {
    const loc = parseHash('#/explore?body=verdance');
    expect(loc.path).toBe('/explore');
    expect(loc.query.get('body')).toBe('verdance');
    expect(parseHash('').path).toBe('/');
    expect(parseHash('#//body//lantern/').path).toBe('/body/lantern');
  });

  it('matches params', () => {
    expect(matchPattern('/body/:id', '/body/verdance')).toEqual({ id: 'verdance' });
    expect(matchPattern('/body/:id', '/body')).toBeNull();
    expect(matchPattern('/', '/')).toEqual({});
  });

  it('resolves every agreed screen', () => {
    for (const path of ['/', '/body/verdance', '/explore', '/build', '/bots', '/policy', '/menu']) {
      expect(resolveRoute(parseHash('#' + path)).route.id).not.toBe('not-found');
    }
    expect(resolveRoute(parseHash('#/nope')).route.id).toBe('not-found');
  });
});
