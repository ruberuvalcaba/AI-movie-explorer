import assert from 'node:assert/strict';
import test from 'node:test';
import { authSearch, getSafeRedirect } from '../src/features/auth/redirect.ts';

test('auth return destination defaults to Home and preserves in-app URLs', () => {
 for (const value of [undefined, null, '', 42]) assert.equal(getSafeRedirect(value), '/');
 for (const value of ['/', '/watchlist', '/profile', '/movie/278?from=search#saved', '/?q=space']) {
  assert.equal(getSafeRedirect(value), value);
 }
 assert.deepEqual(authSearch({}), { redirect: undefined, error: undefined });
 assert.equal(authSearch({ redirect: '/movie/278?from=search#saved' }).redirect, '/movie/278?from=search#saved');
});

test('unsafe and auth-screen destinations fall back to Home without redirect loops', () => {
 for (const value of [
  'https://other.example/steal', '//other.example/steal', '/\\other.example/steal',
  '/%2f%2fother.example/steal', '/%5cother.example/steal', '/%0d%0aLocation:https://other.example',
  '/login', '/register?redirect=/', '/auth/confirm', '/%6cogin', '/%2572egister', '/auth%2fconfirm',
 ]) assert.equal(getSafeRedirect(value), '/', JSON.stringify(value));
 assert.equal(authSearch({ redirect: 'https://other.example' }).redirect, '/');
});
