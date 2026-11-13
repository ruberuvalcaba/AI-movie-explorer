import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeExternalRatings } from '../../src/features/movies/utils/normalize-external-ratings.ts';
import { EXTERNAL_RATINGS_CACHE_TIME, ratingsRetryAt, validRatingsMovieId } from '../../src/features/movies/external-ratings.policy.ts';

const empty = { imdb: null, rottenTomatoes: null, metacritic: null };

test('normalizes only native values and keeps source scales separate', () => {
 assert.deepEqual(normalizeExternalRatings([
  { source: 'imdb', value: 8.2, score: 82, votes: 12345 },
  { source: 'tomatoes', value: 91, score: 2 }, { source: 'popcorn', value: 86 },
  { source: 'metacritic', value: 77 }, { source: 'trakt', value: 99 },
 ]), { imdb: { score: 8.2, voteCount: 12345 }, rottenTomatoes: { criticsScore: 91, audienceScore: 86 }, metacritic: { score: 77 } });
});

test('explicit zero scores and zero votes are valid', () => {
 const entries = ['imdb', 'tomatoes', 'popcorn', 'metacritic'].map(source => ({ source, value: 0, votes: 0 }));
 assert.deepEqual(normalizeExternalRatings(entries), { imdb: { score: 0, voteCount: 0 }, rottenTomatoes: { criticsScore: 0, audienceScore: 0 }, metacritic: { score: 0 } });
});

test('missing, non-numeric, non-finite and out-of-range values normalize to null', () => {
 for (const value of [undefined, null, '', 'N/A', '8.7', -1, 101, Infinity, NaN, true]) {
  assert.deepEqual(normalizeExternalRatings(['imdb','tomatoes','popcorn','metacritic'].map(source => ({ source, value }))), empty);
 }
 assert.equal(normalizeExternalRatings([{source:'imdb',value:11,score:87}]).imdb, null);
 for (const value of [undefined, null, {}, 'invalid', [], [null, 1, 'text']]) assert.deepEqual(normalizeExternalRatings(value), empty);
});

test('IMDb vote counts may be absent but valid ratings still display', () => {
 for(const votes of [undefined, null, -1, 1.5, '123', Infinity]) assert.deepEqual(normalizeExternalRatings([{source:'imdb',value:8,votes}]).imdb, {score:8,voteCount:null});
});

test('Rotten Tomatoes scores are independent and support the audience alias', () => {
 assert.deepEqual(normalizeExternalRatings([{source:'tomatoes',value:73}]).rottenTomatoes, {criticsScore:73,audienceScore:null});
 assert.deepEqual(normalizeExternalRatings([{source:'tomatoesaudience',value:81}]).rottenTomatoes, {criticsScore:null,audienceScore:81});
 assert.equal(normalizeExternalRatings([{source:'popcorn',value:null},{source:'tomatoesaudience',value:0}]).rottenTomatoes.audienceScore, 0);
 assert.equal(normalizeExternalRatings([{source:'popcorn',value:50},{source:'tomatoesaudience',value:90}]).rottenTomatoes.audienceScore, 50);
});

test('movie IDs must be valid signed 32-bit positive integers', () => {
 assert.equal(validRatingsMovieId(157336),true);
 for(const id of [0,-1,1.5,NaN,Infinity,2147483648,'157336',undefined]) assert.equal(validRatingsMovieId(id),false);
 assert.equal(EXTERNAL_RATINGS_CACHE_TIME,86400000);
});

test('rate limits respect seconds, HTTP dates, and daily reset headers', () => {
 const now = Date.parse('2026-11-13T12:00:00Z');
 assert.equal(ratingsRetryAt('120',null,now), now+120000);
 assert.equal(ratingsRetryAt('Fri, 13 Nov 2026 13:00:00 GMT',null,now),now+3600000);
 assert.equal(ratingsRetryAt(null,String((now+300000)/1000),now),now+300000);
 assert.equal(ratingsRetryAt('invalid',null,now),now+60000);
 assert.equal(ratingsRetryAt('-5',null,now),now+60000);
 assert.equal(ratingsRetryAt('0',null,now),now);
});
