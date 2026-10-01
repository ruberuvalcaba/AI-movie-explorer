import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { movieDetailsQuery } from "../queries";

export const usePrefetchMovie = (movieId: number) => {
	const queryClient = useQueryClient();
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const onMouseEnter = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		timeoutRef.current = setTimeout(() => {
			queryClient.prefetchQuery(movieDetailsQuery(movieId));
			timeoutRef.current = null;
		}, 150);
	}, [movieId, queryClient]);

	const onMouseLeave = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return {
		onMouseEnter,
		onMouseLeave,
	};
};
