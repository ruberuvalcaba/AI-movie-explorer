export const MovieSectionHeader = ({
	title,
	count,
}: {
	title: string;
	count: number;
}) => {
	return (
		<h2 className="mb-6 flex items-center gap-3">
			<span className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
				{title}
			</span>

			<span className="rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1 text-xs font-medium text-white/50 shadow-sm backdrop-blur-md">
				{count}
			</span>
		</h2>
	);
};
