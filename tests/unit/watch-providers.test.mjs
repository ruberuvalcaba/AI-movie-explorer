import assert from 'node:assert/strict';
import test from 'node:test';
import { getWatchProviderGroups } from '../../src/features/movies/utils/watch-providers.ts';

const provider = (id, priority) => ({ provider_id: id, provider_name: `Provider ${id}`, logo_path: null, display_priority: priority });

test('availability groups follow the requested order and providers follow display priority', () => {
 const availability = {
  flatrate: [provider(2, 20), provider(1, 1)],
  free: [provider(3, 1)], ads: [provider(4, 1)],
  rent: [provider(5, 1)], buy: [provider(6, 1)],
 };
 const original = structuredClone(availability);
 const groups = getWatchProviderGroups(availability);
 assert.deepEqual(groups.map(group => group.label), ['Stream', 'Free', 'Free with ads', 'Rent', 'Buy']);
 assert.deepEqual(groups[0].providers.map(item => item.provider_id), [1, 2]);
 assert.deepEqual(availability, original, 'Sorting never mutates the shared details cache');
});

test('missing availability and empty categories produce no groups', () => {
 for (const availability of [undefined, null, {}, { flatrate: [], free: [], ads: [], rent: [], buy: [] }]) {
  assert.deepEqual(getWatchProviderGroups(availability), []);
 }
});

test('only populated categories render; missing logos and regional links do not hide providers', () => {
 const groups = getWatchProviderGroups({ rent: [provider(5, 1)] });
 assert.equal(groups.length, 1);
 assert.equal(groups[0].label, 'Rent');
 assert.equal(groups[0].providers[0].logo_path, null);
});

test('the same provider can appear in multiple availability categories', () => {
 const shared = provider(8, 1);
 assert.deepEqual(getWatchProviderGroups({ flatrate: [shared], buy: [shared] }).map(group => group.key), ['flatrate', 'buy']);
});
