import { ExternalLink } from "lucide-react";
import { useState } from "react";
import type {
	WatchProvider,
	WatchProvidersResponse,
} from "@/features/movies/movie.types";
import { getWatchProviderGroups } from "@/features/movies/utils/watch-providers";

type Props = {
	watchProviders?: WatchProvidersResponse | null;
	region?: string;
};

function ProviderLogo({ provider }: { provider: WatchProvider }) {
	const [failed, setFailed] = useState(false);
	if (!provider.logo_path || failed) {
		return (
			<span
				aria-hidden="true"
				className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg font-semibold text-white/60"
			>
				{provider.provider_name.slice(0, 1)}
			</span>
		);
	}
	return (
		<img
			src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
			alt={`${provider.provider_name} logo`}
			width={44}
			height={44}
			loading="lazy"
			decoding="async"
			onError={() => setFailed(true)}
			className="h-11 w-11 rounded-xl object-contain grayscale border border-white/15"
		/>
	);
}

export function MovieWatchProviders({ watchProviders, region = "US" }: Props) {
	const country = region.trim().toUpperCase() || "US";
	const availability = watchProviders?.results?.[country];
	const groups = getWatchProviderGroups(availability);
	return (
		<section
			aria-label={`Where to Watch in ${country}`}
			className="mt-8 min-w-0 border-t border-white/10 pt-6 sm:mt-8 sm:pt-8"
		>
			<div className="mb-5 flex flex-wrap items-center gap-3">
				<h2 className="text-xl font-semibold tracking-tight text-purple-300 sm:text-2xl">
					Where to Watch
				</h2>
				<span className="text-xs font-medium tracking-wider text-white/50">
					{country}
				</span>
			</div>
			{groups.length === 0 ? (
				<p className="text-sm leading-6 text-white/50">
					No streaming availability information is currently available in your
					region.
				</p>
			) : (
				<div className="space-y-5">
					{groups.map((group) => (
						<div key={group.key}>
							<h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/60">
								{group.label}
							</h3>
							<ul
								aria-label={`${group.label} providers`}
								className="flex flex-wrap gap-x-5 gap-y-3"
							>
								{group.providers.map((provider) => (
									<li
										key={provider.provider_id}
										className="flex min-w-0 flex-col items-center gap-2 text-center"
									>
										<ProviderLogo
											key={`${provider.provider_id}:${provider.logo_path}`}
											provider={provider}
										/>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			)}
			{availability?.link && (
				<a
					href={availability.link}
					target="_blank"
					rel="noopener noreferrer"
					className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm text-white/70 underline underline-offset-4 hover:text-purple-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
				>
					View all watch options
					<ExternalLink size={14} aria-hidden="true" />
					<span className="sr-only"> (opens in a new tab)</span>
				</a>
			)}
		</section>
	);
}
