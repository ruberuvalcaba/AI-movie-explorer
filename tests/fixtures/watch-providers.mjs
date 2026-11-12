export function watchProviderFixture(id) {
 const provider = (provider_id, provider_name, display_priority, logo_path) => ({ provider_id, provider_name, display_priority, logo_path });
 const US = {
  link: `https://www.themoviedb.org/movie/${id}/watch?locale=US`,
  flatrate: [provider(8, 'Netflix', 2, '/netflix.png'), provider(9, 'Prime Video', 1, '/prime.png')],
  free: [provider(10, 'Free Service', 1, null)],
  ads: [provider(11, 'Ad Service', 1, '/broken-provider.png')],
  rent: [provider(12, 'Rental Service', 1, '/rental.png')],
  buy: [provider(13, 'Purchase Service', 1, '/purchase.png')],
 };
 switch (id % 10) {
  case 2: return { id, results: { GB: US } }; // Default region is missing.
  case 3: return undefined; // Appended property is missing entirely.
  case 4: return { id, results: {} };
  case 5: return { id, results: { US: { rent: US.rent } } }; // Missing categories/link.
  case 6: return { success: false, status_message: 'Availability unavailable' };
  default: return { id, results: { US } };
 }
}
