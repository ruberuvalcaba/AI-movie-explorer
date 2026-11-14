import type {
	MDBListRating,
	MovieExternalRatings,
} from "@/features/movies/external-ratings.types";

function validScore(value: unknown, maximum: number): value is number {
	return (
		typeof value === "number" &&
		Number.isFinite(value) &&
		value >= 0 &&
		value <= maximum
	);
}

function voteCount(rating: MDBListRating | undefined): number | null {
	const votes = rating?.votes;
	return typeof votes === "number" && Number.isSafeInteger(votes) && votes >= 0
		? votes
		: null;
}

export function normalizeExternalRatings(
	ratings: unknown,
): MovieExternalRatings {
	const entries: MDBListRating[] = Array.isArray(ratings)
		? ratings.filter(
				(entry): entry is MDBListRating =>
					entry !== null && typeof entry === "object",
			)
		: [];
	const find = (source: string, maximum: number) =>
		entries.find(
			(entry) => entry.source === source && validScore(entry.value, maximum),
		);
	const imdb = find("imdb", 10);
	const critics = find("tomatoes", 100);
	const audience = find("popcorn", 100) ?? find("tomatoesaudience", 100);
	const metacritic = find("metacritic", 100);
	return {
		imdb: imdb
			? {
					score: imdb.value as number,
					voteCount: voteCount(imdb),
				}
			: null,
		rottenTomatoes:
			critics || audience
				? {
						criticsScore: critics ? (critics.value as number) : null,
						criticsVoteCount: voteCount(critics),
						audienceScore: audience ? (audience.value as number) : null,
						audienceVoteCount: voteCount(audience),
					}
				: null,
		metacritic: metacritic
			? { score: metacritic.value as number, voteCount: voteCount(metacritic) }
			: null,
	};
}

export function hasExternalRatings(ratings: MovieExternalRatings): boolean {
	return Boolean(ratings.imdb || ratings.rottenTomatoes || ratings.metacritic);
}
