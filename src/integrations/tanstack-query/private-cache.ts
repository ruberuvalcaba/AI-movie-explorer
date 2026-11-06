import type { QueryClient } from "@tanstack/react-query";

// On account changes, abort old reads before removing cached private data.
// A later completion of an old mutation only invalidates its old keys; it never
// writes a response back into the cache. Public TMDB queries stay cached.
export async function clearPrivateCache(
	queryClient: QueryClient,
	keepUserId?: string,
) {
	const filters = {
		predicate: (query: { queryKey: readonly unknown[] }) =>
			query.queryKey[0] === "private" &&
			(!keepUserId || query.queryKey[1] !== keepUserId),
	};
	await queryClient.cancelQueries(filters);
	queryClient.removeQueries(filters);
	for (const mutation of queryClient.getMutationCache().getAll()) {
		if (
			mutation.meta?.private &&
			(!keepUserId || mutation.meta.userId !== keepUserId)
		) {
			queryClient.getMutationCache().remove(mutation);
		}
	}
}
