const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const fetchTmdb = async <T>(
	endpoint: string,
	params?: Record<string, string>,
	signal?: AbortSignal,
): Promise<T> => {
	const token = process.env.TMDB_ACCESS_TOKEN;

	if (!token) {
		throw new Error("Missing TMDB_ACCESS_TOKEN");
	}

	const searchParams = new URLSearchParams(params);
	const url = `${TMDB_BASE_URL}${endpoint}?${searchParams}`;

	const response = await fetch(url, {
		signal,
		headers: {
			Authorization: `Bearer ${token}`,
			accept: "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`TMDB request failed: ${response.status}`);
	}

	return response.json();
};
