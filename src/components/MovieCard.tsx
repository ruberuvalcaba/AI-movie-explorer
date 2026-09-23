import type { Movie } from "@/types/movie";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

interface MovieCardProps {
	movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
	return (
		<article>
			{movie.poster_path && (
				<img
					src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
					alt={movie.title}
				/>
			)}

			<h2>{movie.title}</h2>

			<p>{movie.release_date?.slice(0, 4)}</p>
			<p>⭐ {movie.vote_average.toFixed(1)}</p>
		</article>
	);
};
