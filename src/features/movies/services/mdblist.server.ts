import { ratingsRetryAt } from "@/features/movies/external-ratings.policy";
import type { ExternalRatingsResult } from "@/features/movies/external-ratings.types";
import {
	hasExternalRatings,
	normalizeExternalRatings,
} from "@/features/movies/utils/normalize-external-ratings";

// A rate-limit deadline, not a successful-response cache. Honor the shared key's quota.
let blockedUntil = 0;

export async function getExternalMovieRatings(
	movieId: number,
): Promise<ExternalRatingsResult> {
	const key = process.env.MDBLIST_API_KEY?.trim();
	if (!key)
		return { status: "unavailable", reason: "not-configured", retryAt: null };
	if (Date.now() < blockedUntil)
		return {
			status: "unavailable",
			reason: "rate-limited",
			retryAt: blockedUntil,
		};
	try {
		const url = new URL(`https://api.mdblist.com/tmdb/movie/${movieId}/`);
		url.searchParams.set("apikey", key);
		const response = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(8000),
		});
		if (response.status === 429) {
			blockedUntil = ratingsRetryAt(
				response.headers.get("retry-after"),
				response.headers.get("x-ratelimit-reset"),
			);
			return {
				status: "unavailable",
				reason: "rate-limited",
				retryAt: blockedUntil,
			};
		}
		if (response.status === 401 || response.status === 403)
			return { status: "unavailable", reason: "unauthorized", retryAt: null };
		if (response.status === 404)
			return { status: "missing", ratings: normalizeExternalRatings(null) };
		if (response.status === 400 || response.status === 422)
			return { status: "unavailable", reason: "invalid-id", retryAt: null };
		if (!response.ok)
			return { status: "unavailable", reason: "upstream", retryAt: null };
		let body: unknown;
		try {
			body = await response.json();
		} catch {
			return {
				status: "unavailable",
				reason: "invalid-response",
				retryAt: null,
			};
		}
		if (
			!body ||
			typeof body !== "object" ||
			Array.isArray(body) ||
			"error" in body
		)
			return {
				status: "unavailable",
				reason: "invalid-response",
				retryAt: null,
			};
		const raw = "ratings" in body ? body.ratings : null;
		if (raw !== null && raw !== undefined && !Array.isArray(raw))
			return {
				status: "unavailable",
				reason: "invalid-response",
				retryAt: null,
			};
		const ratings = normalizeExternalRatings(raw);
		return {
			status: hasExternalRatings(ratings) ? "available" : "missing",
			ratings,
		};
	} catch {
		// Never forward fetch errors, URLs, response bodies, or credentials to clients/logs.
		return { status: "unavailable", reason: "network", retryAt: null };
	}
}
