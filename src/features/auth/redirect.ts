const AUTH_REDIRECT_BASE = "https://movie-explorer.invalid";

function isLocalPath(value: string) {
	return (
		value.startsWith("/") &&
		!value.startsWith("//") &&
		!Array.from(value).some(
			(character) =>
				character === "\\" ||
				character.charCodeAt(0) < 32 ||
				character.charCodeAt(0) === 127,
		)
	);
}

// Validate decoded forms too: encoded slashes/backslashes must not turn a path
// into a protocol-relative URL when it is decoded or normalized by a browser.
export function getSafeRedirect(value: unknown, fallback = "/"): string {
	if (typeof value !== "string" || value.length > 2048 || !isLocalPath(value))
		return fallback;
	try {
		let decoded = value;
		for (let attempt = 0; attempt < 8; attempt++) {
			if (!isLocalPath(decoded)) return fallback;
			const next = decodeURIComponent(decoded);
			if (next === decoded) break;
			if (attempt === 7) return fallback;
			decoded = next;
		}
		const decodedUrl = new URL(decoded, AUTH_REDIRECT_BASE);
		const url = new URL(value, AUTH_REDIRECT_BASE);
		const destination = `${url.pathname}${url.search}${url.hash}`;
		if (
			url.origin !== AUTH_REDIRECT_BASE ||
			decodedUrl.origin !== AUTH_REDIRECT_BASE ||
			!isLocalPath(destination) ||
			!isLocalPath(decodedUrl.pathname)
		)
			return fallback;
		// Auth screens cannot be their own return destination.
		if (
			[url.pathname, decodedUrl.pathname].some((path) =>
				/^\/(?:login|register|forgot-password|reset-password|auth)(?:\/|$)/.test(
					path,
				),
			)
		)
			return fallback;
		return destination;
	} catch {
		return fallback;
	}
}

export function authSearch(search: Record<string, unknown>): {
	redirect?: string;
	error?: "confirmation_failed";
} {
	return {
		redirect:
			search.redirect === undefined
				? undefined
				: getSafeRedirect(search.redirect),
		error:
			search.error === "confirmation_failed"
				? "confirmation_failed"
				: undefined,
	};
}
