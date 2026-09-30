import { type QueryKey, useInfiniteQuery } from "@tanstack/react-query";

type PaginatedResponse = {
	page: number;
	total_pages: number;
};

export const usePaginatedFetch = <TPage extends PaginatedResponse>(
	queryKey: QueryKey,
	queryFn: (pageParam: number) => Promise<TPage>,
) => {
	return useInfiniteQuery({
		queryKey,
		initialPageParam: 1,
		staleTime: 10 * 60 * 1000, // Data is considered fresh for 10 minutes.  staleTime → "When should this data be considered old?"
		gcTime: 1000 * 60 * 30, //Data stays cached for 30 minutes. gcTime → "How long should unused data remain cached?"

		queryFn: ({ pageParam }) => queryFn(pageParam),

		getNextPageParam: (lastPage) => {
			const nextPage = lastPage.page + 1;

			return nextPage <= lastPage.total_pages ? nextPage : undefined;
		},
	});
};
