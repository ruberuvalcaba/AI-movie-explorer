import type { MovieExternalRatings } from "@/features/movies/external-ratings.types";
import { formatVoteCount } from "@/features/movies/utils/format-vote-count";

interface Props {
	tmdbScore: number;
	tmdbVoteCount: number;
	externalRatings?: MovieExternalRatings;
	loading?: boolean;
}

function RatingSource({ name, logo }: { name?: string; logo: string }) {
	return (
		<span className=" min-h-10 flex justify-center items-center gap-2 text-center">
			<img
				src={`/ratings/${logo}`}
				alt=""
				aria-hidden="true"
				width={24}
				height={24}
				className="h-6 w-6 shrink-0 object-contain rounded-sm align-middle"
				onError={(event) => {
					event.currentTarget.hidden = true;
				}}
			/>
			{name && <span>{name}</span>}
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
	const labelClass =
		"flex min-h-10 items-center text-xs font-medium text-white/60";
	const valueClass = "mt-1 text-sm font-semibold text-white";
	return (
		<section
			aria-label="Movie ratings"
			className="mt-8 border-y border-white/15 py-4"
		>
			<div className="flex flex-wrap gap-x-6 gap-y-8 sm:gap-x-8">
				<dl>
					<dt className={labelClass}>
						<RatingSource name="TMDb" logo="tmdb.svg" />
					</dt>
					<dd className={valueClass}>{tmdbScore.toFixed(1)}/10</dd>
					<dd className="mt-1 text-xs text-white/50">
						{formatVoteCount(tmdbVoteCount)} votes
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
								{formatVoteCount(imdb.voteCount)} votes
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
						<dl className="flex gap-4">
							{rottenTomatoes.criticsScore !== null && (
								<div>
									<dd className={`${valueClass} flex items-center gap-1.5`}>
										{/* <span aria-hidden="true" className="text-sm">
											🍅
										</span> */}
										{rottenTomatoes.criticsScore}%{" "}
										<dt className="text-[10px] text-white/50">Critics</dt>
									</dd>
									{rottenTomatoes.criticsVoteCount != null && (
										<dd className="mt-1 text-xs text-white/50">
											{formatVoteCount(rottenTomatoes.criticsVoteCount)} reviews
										</dd>
									)}
								</div>
							)}
							{rottenTomatoes.audienceScore !== null && (
								<div>
									<dd className={`${valueClass} flex items-center gap-1.5`}>
										{/* <span aria-hidden="true" className="text-sm">
											🍿
										</span> */}
										{rottenTomatoes.audienceScore}%
										<dt className="text-[10px] text-white/50">Audience</dt>
									</dd>
									{rottenTomatoes.audienceVoteCount != null && (
										<dd className="mt-1 text-xs text-white/50">
											{formatVoteCount(rottenTomatoes.audienceVoteCount)}{" "}
											ratings
										</dd>
									)}
								</div>
							)}
						</dl>
					</div>
				)}
				{/* {metacritic && (
					<dl>
						<dt className={labelClass}>
							<RatingSource name="Metacritic" logo="metacritic.svg" />
						</dt>
						<dd className={valueClass}>{metacritic.score}/100</dd>
						{metacritic.voteCount != null && (
							<dd className="mt-1 text-xs text-white/50">
								{formatVoteCount(metacritic.voteCount)} reviews
							</dd>
						)}
					</dl>
				)} */}
			</div>
			{loading && (
				<output className="mt-3 block text-xs text-white/50">
					Loading other ratings…
				</output>
			)}
		</section>
	);
}
