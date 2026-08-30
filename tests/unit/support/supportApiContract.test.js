import { describe, expect, it } from 'vitest';

import { buildBody, pickParams } from '@/utils/requestContract';

/**
 * The backend rejects an undeclared query parameter or body field with a 400,
 * so every help centre call declares its keys. These assert the declared-key
 * behaviour the support services rely on.
 */
describe('support request contract', () => {
  it('drops a filter key the endpoint does not declare', () => {
    const params = pickParams({ limit: 20, status: 'open' }, ['limit']);
    expect(params).toEqual({ limit: 20 });
  });

  it('drops empty and whitespace-only values', () => {
    expect(pickParams({ token: '   ' }, ['token'])).toEqual({});
    expect(pickParams({ token: '' }, ['token'])).toEqual({});
  });

  it('keeps a token that is present', () => {
    expect(pickParams({ token: 'abc' }, ['token'])).toEqual({ token: 'abc' });
  });

  // buildBody drops only undefined. A null is meaningful and an empty string is
  // the caller's choice, so neither is removed.
  it('drops only undefined body fields', () => {
    expect(buildBody({ a: undefined, b: null, c: '' })).toEqual({ b: null, c: '' });
  });
});
