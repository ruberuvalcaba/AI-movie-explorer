import { useNavigate, useSearch } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

export const MovieSearchBar = () => {
	const navigate = useNavigate();
	const search = useSearch({ strict: false });
	const query = search.q ?? "";
	const [input, setInput] = useState(query);
	useEffect(() => {
		setInput(query);
	}, [query]);
	return (
		<form
			aria-label="Search movies"
			className="mx-auto flex min-w-0 max-w-2xl flex-1 gap-1 sm:gap-2"
			onSubmit={(event) => {
				event.preventDefault();
				void navigate({ to: "/", search: { q: input.trim() || undefined } });
			}}
		>
			<label htmlFor="movie-search" className="sr-only">
				Search movies by title
			</label>
			<div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/20 bg-black/20 px-2 sm:px-4 focus-within:ring-2 focus-within:ring-purple-400">
				<input
					id="movie-search"
					type="search"
					value={input}
					onChange={(event) => {
						setInput(event.target.value);
					}}
					maxLength={200}
					placeholder="Search movies..."
					className="min-w-0 w-full bg-transparent py-3 text-base text-white outline-none placeholder:text-white/50"
				/>
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
						onClick={() => {
							setInput("");
							void navigate({ to: "/", search: {} });
						}}
						className="cursor-pointer"
					>
						<X size={20} aria-hidden="true" />
					</button>
				)}
			</div>
		</form>
	);
};
