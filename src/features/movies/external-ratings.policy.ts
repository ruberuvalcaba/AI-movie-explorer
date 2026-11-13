import type { ExternalRatingsFailure } from "@/features/movies/external-ratings.types";

export const EXTERNAL_RATINGS_CACHE_TIME = 24 * 60 * 60_000;
export const validRatingsMovieId = (id: number) =>
	Number.isSafeInteger(id) && id > 0 && id <= 2_147_483_647;

export class ExternalRatingsError extends Error {
	reason: ExternalRatingsFailure;
	retryAt: number | null;
	constructor(reason: ExternalRatingsFailure, retryAt: number | null = null) {
		super("External ratings are temporarily unavailable.");
		this.name = "ExternalRatingsError";
		this.reason = reason;
		this.retryAt = retryAt;
	}
}

export function ratingsRetryAt(
	retryAfter: string | null,
	reset: string | null,
	now = Date.now(),
): number {
	if (retryAfter?.trim()) {
		const seconds = Number(retryAfter);
		if (Number.isFinite(seconds) && seconds >= 0) return now + seconds * 1000;
		if (!Number.isFinite(seconds)) {
			const date = Date.parse(retryAfter);
			if (Number.isFinite(date)) return Math.max(now, date);
		}
	}
	if (reset?.trim()) {
		const timestamp = Number(reset) * 1000;
		if (Number.isFinite(timestamp) && timestamp >= now) return timestamp;
	}
	return now + 60_000;
}
