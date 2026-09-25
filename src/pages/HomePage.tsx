import { TopRatedMovies } from "#/features/movies/components/TopRatedMovies";
import { TrendingMovies } from "#/features/movies/components/TrendingMovies";
import { PopularMovies } from "@/features/movies/components/PopularMovies";
import { UpcomingMovies } from "@/features/movies/components/UpcomingMovies";

export const HomePage = () => {
	return (
		<div className="relative h-screen overflow-hidden bg-[#07070a] text-white">
			{/* ───────────────── TV SCREEN / CONTENT ───────────────── */}
			<div className="absolute inset-5 top-20 overflow-y-auto rounded-[35px]">
				<main className="mx-auto max-w-full py-8">
					<PopularMovies />
					<TopRatedMovies />
					<TrendingMovies />
					<UpcomingMovies />
				</main>
			</div>

			{/* ───────────────── CINEMATIC TV FRAME ───────────────── */}
			<div className="pointer-events-none fixed inset-5 top-20 z-10 rounded-[35px] border border-white/15 opacity-[0.15]">
				<svg className="absolute inset-0 h-full w-full rounded-[35px]">
					<filter id="noise">
						<feTurbulence
							type="fractalNoise"
							baseFrequency="0.8"
							numOctaves="4"
							stitchTiles="stitch"
						/>
					</filter>

					<rect width="100%" height="100%" filter="url(#noise)" />
				</svg>
				{/* Top TV bezel / glow */}
				<div
					className="
		absolute inset-x-0 top-0 h-32
		bg-gradient-to-b
		from-[#07070a]
		via-[#07070a]/95
		to-transparent
	"
				/>

				{/* Ambient glow */}
				<div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-purple-300/30 blur-[120px]" />

				<div className="absolute -right-40 top-[20%] h-[700px] w-[700px] rounded-full bg-blue-300/30 blur-[140px]" />

				<div className="absolute bottom-[-300px] left-[30%] h-[600px] w-[600px] rounded-full bg-pink-300/20 blur-[140px]" />
			</div>
		</div>
	);
};
