export const formatRuntime = (minutes: number): string => {
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	if (hours === 0) {
		return `${remainingMinutes}m`;
	}

	if (remainingMinutes === 0) {
		return `${hours}h`;
	}

	return `${hours}h ${remainingMinutes}m`;
};
export const formatAiError = (error: Error) => {
	try {
		const payload = JSON.parse(error.message);

		const message = payload?.error?.message;

		if (!message) {
			return "Sorry, I couldn't generate a response right now. Please try again.";
		}

		const nestedPayload = JSON.parse(message);

		return (
			nestedPayload?.error?.message ??
			"Sorry, I couldn't generate a response right now. Please try again."
		);
	} catch {
		return "Sorry, I couldn't generate a response right now. Please try again.";
	}
};
