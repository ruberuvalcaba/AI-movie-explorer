const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN;

if (!token) {
	throw new Error("Missing VITE_TMDB_ACCESS_TOKEN");
}

export const movieApi = async <T>(
	endpoint: string,
	params?: Record<string, string>,
): Promise<T> => {
	const searchParams = new URLSearchParams(params);

	const url = `${TMDB_BASE_URL}${endpoint}?${searchParams}`;

	const response = await fetch(url, {
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
