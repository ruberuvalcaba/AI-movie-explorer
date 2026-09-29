import { MovieSpinner } from "#/components/MovieSpinner";

interface CastMember {
	id: number;
	name: string;
	character: string;
	profile_path: string | null;
	order: number;
}

interface MovieCastProps {
	cast: CastMember[];
	isLoading: boolean;
}

const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w342";

export function MovieCast({ cast, isLoading }: MovieCastProps) {
	if (isLoading) return <MovieSpinner />;
	if (!cast.length) {
		return null;
	}

	return (
		<section className="mt-16">
			{/* Section header */}
			<div className="mb-6 flex items-end justify-between border-b border-white/10 pb-4">
				<div>
					<p className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-white/40">
						The Ensemble
					</p>

					<h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
						Cast
					</h2>
				</div>

				<span className="text-xs uppercase tracking-widest text-white/30">
					{cast.length} Actors
				</span>
			</div>

			{/* Cast rail */}
			<div className="flex gap-5 overflow-x-auto pb-6 scrollbar-none">
				{cast.map((member) => (
					<article
						key={member.id}
						className="group w-[150px] shrink-0 md:w-[170px]"
					>
						{/* Portrait */}
						<div className="relative aspect-[3/4] overflow-hidden rounded-[12px] bg-white/5">
							{member.profile_path ? (
								<img
									src={`${TMDB_IMAGE_URL}${member.profile_path}`}
									alt={member.name}
									loading="lazy"
									className="
                    h-full
                    w-full
                    object-cover
                    grayscale-[20%]
                    transition-all
                    duration-300
                    ease-out
                    group-hover:scale-[1.04]
                    group-hover:grayscale-0
                  "
								/>
							) : (
								<div className="flex h-full items-center justify-center">
									<span className="text-xs uppercase tracking-widest text-white/20">
										No Image
									</span>
								</div>
							)}

							{/* Bottom gradient */}
							<div
								className="
                  pointer-events-none
                  absolute inset-x-0 bottom-0 h-1/2
                  bg-gradient-to-t from-black/70 to-transparent
                  opacity-80
                "
							/>
						</div>

						{/* Metadata */}
						<div className="mt-3">
							<h3 className="truncate text-sm font-medium text-white">
								{member.name}
							</h3>

							<p className="mt-1 truncate text-xs text-white/40">
								{member.character}
							</p>
						</div>
					</article>
				))}
			</div>
		</section>
	);
}
