import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { movieDetailsQuery } from "../queries";

export const usePrefetchMovie = (movieId: number) => {
	const queryClient = useQueryClient();
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const onMouseEnter = () => {
		timeoutRef.current = setTimeout(() => {
			queryClient.prefetchQuery(movieDetailsQuery(movieId));
		}, 150);
	};

	const onMouseLeave = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
	};

	return {
		onMouseEnter,
		onMouseLeave,
	};
};
