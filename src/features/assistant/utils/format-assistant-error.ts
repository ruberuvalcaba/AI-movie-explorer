export const formatAssistantError = (error: Error) => {
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
