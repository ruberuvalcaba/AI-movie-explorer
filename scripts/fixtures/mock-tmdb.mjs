// Loaded only by the local HTTP test child. Never intercept real application traffic.
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, options) => {
 const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
 if (url.hostname === 'api.themoviedb.org') {
  return originalFetch(new URL(url.pathname + url.search, process.env.TEST_TMDB_URL), options);
 }
 return originalFetch(input, options);
};
