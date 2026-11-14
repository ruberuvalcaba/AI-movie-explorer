const voteCountFormatter = new Intl.NumberFormat("en-US", {
	notation: "compact",
	compactDisplay: "short",
	maximumFractionDigits: 1,
});

/** Round vote counts to compact labels such as 4.8k, 564k, and 1m. */
export function formatVoteCount(votes: number): string {
	const count = Number.isFinite(votes) ? Math.max(0, Math.round(votes)) : 0;
	return voteCountFormatter.format(count).toLowerCase();
}
