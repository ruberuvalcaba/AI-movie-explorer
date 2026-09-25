import type { Movie } from "@/types/movie";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

interface MovieCardProps {
	movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
	return (
		<div className="group relative aspect-[2/3] w-[250px] shrink-0 overflow-hidden rounded-[20px] bg-zinc-900 shadow-xl sm:w-[250px]">
			{/* Background */}
			<img
				src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
				alt={movie.title}
				className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
			/>

			{/* Cinematic overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5 transition-opacity duration-300 group-hover:opacity-0" />

			{/* Glass content */}
			<div className="absolute inset-x-0 bottom-0">
				{/* Soft fade between poster and glass */}
				<div
					className="
					pointer-events-none absolute inset-x-0 bottom-full h-20
					bg-gradient-to-b
					from-transparent
					to-white/10
				"
				/>

				{/* Glass panel */}
				<div
					className="
					relative min-h-[120px]
					flex flex-col
					rounded-b-[20px]
					border-x border-b border-white/15
					bg-white/10
					p-3
					shadow-2xl
					backdrop-blur-xl
				"
				>
					{/* Title */}
					<h3 className="mb-2 text-lg font-bold tracking-tight text-white">
						{movie.title}
					</h3>

					<div className="flex items-center justify-between mt-auto">
						{/* Rating */}
						<div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
							<span className="text-yellow-400">★</span>
							<span>{movie.vote_average.toFixed(1)}</span>
						</div>

						{/* Year */}
						<div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md">
							{movie.release_date?.slice(0, 4)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
