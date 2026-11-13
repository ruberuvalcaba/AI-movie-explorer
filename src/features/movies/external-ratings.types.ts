/** Untrusted MDBList fields: native values are validated before use. */
export interface MDBListRating {
	source?: unknown;
	value?: unknown;
	score?: unknown;
	votes?: unknown;
}
export interface MDBListResponse {
	ratings?: MDBListRating[] | null;
}

export interface MovieExternalRatings {
	imdb: { score: number; voteCount: number | null } | null;
	rottenTomatoes: {
		criticsScore: number | null;
		audienceScore: number | null;
	} | null;
	metacritic: { score: number } | null;
}

export type ExternalRatingsFailure =
	| "not-configured"
	| "unauthorized"
	| "invalid-id"
	| "rate-limited"
	| "network"
	| "upstream"
	| "invalid-response";
export type ExternalRatingsResult =
	| { status: "available" | "missing"; ratings: MovieExternalRatings }
	| {
			status: "unavailable";
			reason: ExternalRatingsFailure;
			retryAt: number | null;
	  };
