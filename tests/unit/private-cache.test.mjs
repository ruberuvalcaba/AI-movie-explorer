import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient, isCancelledError } from '@tanstack/react-query';
import { clearPrivateCache } from '../../src/integrations/tanstack-query/private-cache.ts';

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });

test('account switch removes other users and preserves active-user/public cache', async () => {
 const queryClient = client();
 try {
  queryClient.setQueryData(['movies', 'popular', 1], ['public movie']);
  queryClient.setQueryData(['private', 'previous', 'savedMovies', 'watchlist'], ['previous secret']);
  queryClient.setQueryData(['private', 'previous', 'savedMovies', 'favorites'], ['previous favorite']);
  queryClient.setQueryData(['private', 'current', 'savedMovies', 'favorites'], ['current favorite']);
  queryClient.setQueryData(['private', 'previous', 'profile'], { displayName: 'Previous user' });
  queryClient.setQueryData(['private', 'current', 'savedMovies', 'watchlist'], ['current saved movie']);
  const mutations = queryClient.getMutationCache();
  const previous = mutations.build(queryClient, { meta: { private: true, userId: 'previous' } });
  const current = mutations.build(queryClient, { meta: { private: true, userId: 'current' } });
  const publicMutation = mutations.build(queryClient, { mutationKey: ['public'], meta: { private: false } });
  await clearPrivateCache(queryClient, 'current');
  assert.equal(queryClient.getQueryData(['private', 'previous', 'savedMovies', 'watchlist']), undefined);
  assert.equal(queryClient.getQueryData(['private', 'previous', 'profile']), undefined);
  assert.equal(queryClient.getQueryData(['private', 'previous', 'savedMovies', 'favorites']), undefined);
  assert.deepEqual(queryClient.getQueryData(['private', 'current', 'savedMovies', 'favorites']), ['current favorite']);
  assert.deepEqual(queryClient.getQueryData(['private', 'current', 'savedMovies', 'watchlist']), ['current saved movie']);
  assert.deepEqual(queryClient.getQueryData(['movies', 'popular', 1]), ['public movie']);
  assert.ok(!mutations.getAll().includes(previous));
  assert.ok(mutations.getAll().includes(current));
  assert.ok(mutations.getAll().includes(publicMutation));
 } finally { queryClient.clear(); }
});

test('account switch aborts old in-flight reads and late mutations cannot restore private data', async () => {
 const queryClient = client();
 try {
  const queryKey = ['private', 'previous', 'savedMovies', 'watchlist'];
  let queryAborted = false;
  let finishRead;
  const oldRead = queryClient.fetchQuery({ queryKey, queryFn: ({ signal }) => new Promise((resolve, reject) => {
   finishRead = resolve;
   signal.addEventListener('abort', () => { queryAborted = true; reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
  }) }).catch(error => error);
  let finishWrite;
  const oldMutation = queryClient.getMutationCache().build(queryClient, {
   meta: { private: true, userId: 'previous' },
   mutationFn: () => new Promise(resolve => { finishWrite = resolve; }),
   onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const oldWrite = oldMutation.execute({ movieId: 278 });
  // Mutation execution starts on a promise turn.
  while (!finishWrite) await Promise.resolve();
  await clearPrivateCache(queryClient, 'current');
  assert.equal(queryAborted, true);
  assert.ok(isCancelledError(await oldRead));
  assert.equal(queryClient.getQueryState(queryKey), undefined);
  assert.ok(!queryClient.getMutationCache().getAll().includes(oldMutation));
  finishRead(['late private response']);
  finishWrite({ movieId: 278 });
  await oldWrite;
  await Promise.resolve();
  assert.equal(queryClient.getQueryState(queryKey), undefined, 'Old invalidation does not recreate removed private queries');
 } finally { queryClient.clear(); }
});

test('logout removes every private cache while retaining public movie data', async () => {
 const queryClient = client();
 try {
  queryClient.setQueryData(['movie', 278], { title: 'Public movie details' });
  queryClient.setQueryData(['private', 'user-one', 'savedMovies', 'watchlist'], ['one']);
  queryClient.setQueryData(['private', 'user-two', 'savedMovies', 'favorites'], ['two']);
  queryClient.getMutationCache().build(queryClient, { meta: { private: true, userId: 'user-one' } });
  await clearPrivateCache(queryClient);
  assert.equal(queryClient.getQueryCache().findAll({ queryKey: ['private'] }).length, 0);
  assert.equal(queryClient.getMutationCache().getAll().length, 0);
  assert.deepEqual(queryClient.getQueryData(['movie', 278]), { title: 'Public movie details' });
 } finally { queryClient.clear(); }
});
