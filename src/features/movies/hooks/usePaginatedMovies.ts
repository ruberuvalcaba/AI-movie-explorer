import { type QueryKey, useInfiniteQuery } from "@tanstack/react-query";

type PaginatedResponse = {
	page: number;
	total_pages: number;
};

export const usePaginatedMovies = <TPage extends PaginatedResponse>(
	queryKey: QueryKey,
	queryFn: (pageParam: number) => Promise<TPage>,
) => {
	return useInfiniteQuery({
		queryKey,
		initialPageParam: 1,

		queryFn: ({ pageParam }) => queryFn(pageParam),

		getNextPageParam: (lastPage) => {
			const nextPage = lastPage.page + 1;

			return nextPage <= lastPage.total_pages ? nextPage : undefined;
		},
	});
};
