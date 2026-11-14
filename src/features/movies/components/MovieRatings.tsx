import type { MovieExternalRatings } from "@/features/movies/external-ratings.types";

interface Props {
	tmdbScore: number;
	tmdbVoteCount: number;
	externalRatings?: MovieExternalRatings;
	loading?: boolean;
}

function RatingSource({ name, logo }: { name: string; logo: string }) {
	return (
		<span className="inline-flex min-h-5 items-center gap-2">
			<img
				src={`/ratings/${logo}`}
				alt=""
				aria-hidden="true"
				width={24}
				height={20}
				className="h-5 w-6 shrink-0 object-contain"
				onError={(event) => {
					event.currentTarget.hidden = true;
				}}
			/>
			<span>{name}</span>
		</span>
	);
}

export function MovieRatings({
	tmdbScore,
	tmdbVoteCount,
	externalRatings,
	loading = false,
}: Props) {
	const { imdb, rottenTomatoes, metacritic } = externalRatings ?? {};
	const labelClass = "text-xs font-medium text-white/60";
	const valueClass = "mt-1 text-sm font-semibold text-white";
	return (
		<section
			aria-label="Movie ratings"
			className="mt-10 border-t border-white/10 pt-6"
		>
			<div className="flex flex-wrap gap-x-6 gap-y-4">
				<dl>
					<dt className={labelClass}>
						<RatingSource name="TMDB" logo="tmdb.svg" />
					</dt>
					<dd className={valueClass}>{tmdbScore.toFixed(1)}/10</dd>
					<dd className="mt-1 text-xs text-white/50">
						{tmdbVoteCount.toLocaleString("en-US")} votes
					</dd>
				</dl>

				{imdb && (
					<dl>
						<dt className={labelClass}>
							<RatingSource name="IMDb" logo="imdb.png" />
						</dt>
						<dd className={valueClass}>{imdb.score.toFixed(1)}/10</dd>
						{imdb.voteCount !== null && (
							<dd className="mt-1 text-xs text-white/50">
								{imdb.voteCount.toLocaleString("en-US")} votes
							</dd>
						)}
					</dl>
				)}
				{rottenTomatoes && (
					<div>
						<p className={labelClass}>
							<RatingSource
								name="Rotten Tomatoes®"
								logo="rotten-tomatoes.svg"
							/>
						</p>
						<dl className="flex flex-wrap gap-x-5 gap-y-2">
							{rottenTomatoes.criticsScore !== null && (
								<div>
									<dt className="mt-1 text-xs text-white/50">Critics</dt>
									<dd className={valueClass}>{rottenTomatoes.criticsScore}%</dd>
								</div>
							)}
							{rottenTomatoes.audienceScore !== null && (
								<div>
									<dt className="mt-1 text-xs text-white/50">Audience</dt>
									<dd className={valueClass}>
										{rottenTomatoes.audienceScore}%
									</dd>
								</div>
							)}
						</dl>
					</div>
				)}
				{metacritic && (
					<dl>
						<dt className={labelClass}>
							<RatingSource name="Metacritic" logo="metacritic.svg" />
						</dt>
						<dd className={valueClass}>{metacritic.score}/100</dd>
					</dl>
				)}
			</div>
			{loading && (
				<output className="mt-3 block text-xs text-white/50">
					Loading other ratings…
				</output>
			)}
		</section>
	);
}
