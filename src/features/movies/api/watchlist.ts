export const saveWatchlistChange = async (
	movieId: number,
	action: "add" | "remove",
) => {
	await new Promise((resolve) => setTimeout(resolve, 800));

	// Simulate failure
	if (Math.random() < 0.3) {
		throw new Error("Failed to update watchlist");
	}

	return {
		movieId,
		action,
	};
};
