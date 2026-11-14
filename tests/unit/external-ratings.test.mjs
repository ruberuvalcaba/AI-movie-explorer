import { formatVoteCount } from '../../src/features/movies/utils/format-vote-count.ts';
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
 ]), { imdb: { score: 8.2, voteCount: 12345 }, rottenTomatoes: { criticsScore: 91, criticsVoteCount: null, audienceScore: 86, audienceVoteCount: null }, metacritic: { score: 77, voteCount: null } });
});

test('explicit zero scores and zero votes are valid', () => {
 const entries = ['imdb', 'tomatoes', 'popcorn', 'metacritic'].map(source => ({ source, value: 0, votes: 0 }));
 assert.deepEqual(normalizeExternalRatings(entries), { imdb: { score: 0, voteCount: 0 }, rottenTomatoes: { criticsScore: 0, criticsVoteCount: 0, audienceScore: 0, audienceVoteCount: 0 }, metacritic: { score: 0, voteCount: 0 } });
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
 assert.deepEqual(normalizeExternalRatings([{source:'tomatoes',value:73}]).rottenTomatoes, {criticsScore:73,criticsVoteCount:null,audienceScore:null,audienceVoteCount:null});
 assert.deepEqual(normalizeExternalRatings([{source:'tomatoesaudience',value:81}]).rottenTomatoes, {criticsScore:null,criticsVoteCount:null,audienceScore:81,audienceVoteCount:null});
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

 test('Rotten Tomatoes vote counts follow their source and reject invalid values', () => {
  for (const votes of [undefined, null, -1, 1.5, '123', Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
   const ratings = normalizeExternalRatings([{source:'tomatoes',value:91,votes},{source:'popcorn',value:86,votes}]).rottenTomatoes;
   assert.equal(ratings.criticsVoteCount, null);
   assert.equal(ratings.audienceVoteCount, null);
  }
  const ratings = normalizeExternalRatings([{source:'tomatoes',value:91,votes:250},{source:'tomatoesaudience',value:86,votes:12345}]).rottenTomatoes;
  assert.equal(ratings.criticsVoteCount, 250);
  assert.equal(ratings.audienceVoteCount, 12345);
  assert.equal(normalizeExternalRatings([{source:'popcorn',value:50,votes:12},{source:'tomatoesaudience',value:90,votes:34}]).rottenTomatoes.audienceVoteCount, 12);
 });

test('Metacritic vote counts are optional and validated independently of the score', () => {
 for (const votes of [undefined, null, -1, 1.5, '123', Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
  assert.deepEqual(normalizeExternalRatings([{source:'metacritic',value:77,votes}]).metacritic, {score:77,voteCount:null});
 }
 assert.deepEqual(normalizeExternalRatings([{source:'metacritic',value:77,votes:1234}]).metacritic, {score:77,voteCount:1234});
 assert.equal(normalizeExternalRatings([{source:'metacritic',value:null,votes:1234}]).metacritic, null);
});

test('vote counts use rounded compact labels and normalize invalid counts', () => {
 for (const [votes, label] of [
  [0, '0'], [100, '100'], [999, '999'], [1000, '1k'],
  [4800, '4.8k'], [4849, '4.8k'], [4850, '4.9k'],
  [564000, '564k'], [999999, '1m'], [1000000, '1m'],
  [1250000, '1.3m'], [1000000000, '1b'],
  [-1, '0'], [NaN, '0'], [Infinity, '0'],
 ]) assert.equal(formatVoteCount(votes), label);
});
