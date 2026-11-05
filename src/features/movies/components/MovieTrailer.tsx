import { Play, X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { MovieVideo } from "#/types/movie";

type MovieTrailerProps = {
	movieTitle: string;
	videos: MovieVideo[];
};

export const MovieTrailer = ({ movieTitle, videos }: MovieTrailerProps) => {
	const trailers = videos.filter(
		(video) =>
			video.site === "YouTube" && video.type === "Trailer" && video.key,
	);
	const trailer = trailers.find((video) => video.official) ?? trailers[0];

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<button
					type="button"
					disabled={!trailer}
					className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Play size={17} fill="currentColor" />
					{trailer ? "Watch Trailer" : "Trailer unavailable"}
				</button>
			</Dialog.Trigger>
			{trailer && (
				<Dialog.Portal>
					<Dialog.Overlay className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm" />
					<Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/15 bg-[#111116] text-white shadow-2xl">
						<div className="flex items-center justify-between gap-4 p-4">
							<div>
								<Dialog.Title className="text-lg font-semibold">
									{movieTitle} — Trailer
								</Dialog.Title>
								<Dialog.Description className="text-sm text-white/60">
									{trailer.name}
								</Dialog.Description>
							</div>
							<Dialog.Close asChild>
								<button
									type="button"
									aria-label="Close trailer"
									className="cursor-pointer rounded-full p-2 hover:bg-white/10"
								>
									<X size={22} />
								</button>
							</Dialog.Close>
						</div>
						<iframe
							className="aspect-video max-h-[70dvh] w-full bg-black"
							src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}?autoplay=1&rel=0`}
							title={`${movieTitle} trailer`}
							allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
							allowFullScreen
							referrerPolicy="strict-origin-when-cross-origin"
						/>
						<div className="p-3 text-right">
							<a
								href={`https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-white/70 underline hover:text-white"
							>
								Watch on YouTube
							</a>
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			)}
		</Dialog.Root>
	);
};
