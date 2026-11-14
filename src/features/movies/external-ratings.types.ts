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
		criticsVoteCount: number | null;
		audienceScore: number | null;
		audienceVoteCount: number | null;
	} | null;
	metacritic: { score: number; voteCount: number | null } | null;
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
