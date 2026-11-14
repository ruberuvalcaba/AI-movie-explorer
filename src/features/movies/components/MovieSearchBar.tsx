import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import { House, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MovieSearchSuggestions } from "@/features/movies/components/MovieSearchSuggestions";
import { searchMoviesQuery } from "@/features/movies/movie.queries";
import { registerSuggestionDismissal } from "@/features/movies/search-suggestions.events";

export const MovieSearchBar = () => {
	const navigate = useNavigate();
	const formRef = useRef<HTMLFormElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const search = useSearch({ strict: false });
	const locationHref = useLocation({ select: (location) => location.href });
	const previousLocationHref = useRef(locationHref);
	const query = search.q ?? "";
	const [input, setInput] = useState(query);
	const [suggestionQuery, setSuggestionQuery] = useState("");
	const [suggestionsOpen, setSuggestionsOpen] = useState(false);
	useEffect(() => {
		if (previousLocationHref.current === locationHref) return;
		previousLocationHref.current = locationHref;
		setInput("");
		setSuggestionQuery("");
		setSuggestionsOpen(false);
	}, [locationHref]);
	useEffect(() => {
		const timeout = window.setTimeout(() => {
			setSuggestionQuery(input.trim());
		}, 300);
		return () => window.clearTimeout(timeout);
	}, [input]);
	useEffect(() => {
		if (!suggestionsOpen || !formRef.current) return;
		return registerSuggestionDismissal(formRef.current, () => {
			setSuggestionsOpen(false);
		});
	}, [suggestionsOpen]);
	const { data, isPending, isError } = useInfiniteQuery({
		...searchMoviesQuery(suggestionQuery),
		enabled: suggestionsOpen && suggestionQuery.length > 0,
	});
	const movies = data?.pages[0]?.results.slice(0, 5) ?? [];
	const showSuggestions = suggestionsOpen && input.trim().length > 0;
	const waitingForSearch = input.trim() !== suggestionQuery || isPending;
	return (
		<form
			aria-label="Search movies"
			className="relative mx-auto flex min-w-0 max-w-2xl flex-1 gap-1 sm:gap-2"
			ref={formRef}
			onKeyDown={(event) => {
				if (event.key === "Escape") setSuggestionsOpen(false);
			}}
			onSubmit={(event) => {
				event.preventDefault();
				const submittedQuery = input.trim();
				setInput("");
				setSuggestionQuery("");
				setSuggestionsOpen(false);
				void navigate({ to: "/", search: { q: submittedQuery || undefined } });
			}}
		>
			<label htmlFor="movie-search" className="sr-only">
				Search movies by title
			</label>
			<div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/20 bg-black/20 px-2 sm:px-4 focus-within:ring-2 focus-within:ring-purple-400">
				<input
					id="movie-search"
					ref={inputRef}
					type="search"
					value={input}
					onChange={(event) => {
						setInput(event.target.value);
						setSuggestionsOpen(true);
					}}
					onFocus={() => setSuggestionsOpen(true)}
					autoComplete="off"
					aria-controls={
						showSuggestions ? "movie-search-suggestions" : undefined
					}
					maxLength={200}
					placeholder="Search movies..."
					className="min-w-0 w-full bg-transparent py-3 text-base text-white outline-none placeholder:text-white/50"
				/>
				{input.length > 0 && (
					<button
						type="button"
						aria-label="Clear search text"
						title="Clear text only"
						onClick={() => {
							setInput("");
							setSuggestionQuery("");
							inputRef.current?.focus();
							setSuggestionsOpen(false);
						}}
						className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
					>
						<X size={18} aria-hidden="true" />
					</button>
				)}
				<button
					type="submit"
					aria-label="Search movies"
					disabled={!input.trim()}
					className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Search size={20} aria-hidden="true" />
				</button>
				{query && (
					<button
						type="button"
						aria-label="Clear search and return home"
						title="Clear search and return home"
						onClick={() => {
							setInput("");
							setSuggestionsOpen(false);
							void navigate({ to: "/", search: {} });
						}}
						className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
					>
						<House size={20} aria-hidden="true" />
					</button>
				)}
			</div>
			{showSuggestions && (
				<MovieSearchSuggestions
					movies={movies}
					isLoading={waitingForSearch}
					isError={isError && movies.length === 0}
					onSelect={() => {
						setInput("");
						setSuggestionQuery("");
						setSuggestionsOpen(false);
						// Dismiss the mobile keyboard after a successful selection.
						formRef.current?.querySelector("input")?.blur();
					}}
				/>
			)}
		</form>
	);
};
