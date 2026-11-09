/** Keep the list mounted during touch gestures; mobile blur can have no relatedTarget. */
export function registerSuggestionDismissal(
	container: HTMLElement,
	dismiss: () => void,
) {
	const document = container.ownerDocument;
	const dismissOutside = (event: Event) => {
		if (event.target && !container.contains(event.target as Node)) dismiss();
	};

	// Capture outside interactions even when another control stops propagation.
	document.addEventListener("pointerdown", dismissOutside, { capture: true });
	document.addEventListener("focusin", dismissOutside, { capture: true });
	return () => {
		document.removeEventListener("pointerdown", dismissOutside, {
			capture: true,
		});
		document.removeEventListener("focusin", dismissOutside, { capture: true });
	};
}
