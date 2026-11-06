export const MovieSectionHeader = ({
	title,
	count = 0,
}: {
	title: string;
	count: number | string;
}) => {
	return (
		<h2 className="flex min-w-0 flex-wrap items-center gap-2 px-3 py-4 sm:gap-3 sm:px-7 sm:py-6">
			<span className="text-xl font-bold tracking-tight text-white sm:text-3xl">
				{title}
			</span>

			<span className="shrink-0 rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1 text-xs font-medium text-white/50 shadow-sm backdrop-blur-md">
				{count}
			</span>
		</h2>
	);
};
