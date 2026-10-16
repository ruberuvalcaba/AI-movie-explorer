import { useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

type IconButtonProps = {
	title?: string;
	count?: number | string;
	icon: LucideIcon;
	route?: string;
};

export const IconButton = ({
	title = "",
	icon: Icon,
	count,
	route,
}: IconButtonProps) => {
	const navigate = useNavigate();

	return (
		<button
			type="button"
			onClick={() => navigate({ to: route || "/" })}
			aria-label={`${title}${count ? `, ${count} items` : ""}`}
			title={title}
			className="cursor-pointer group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
		>
			<Icon
				size={18}
				strokeWidth={1.8}
				className="transition-transform duration-200 group-hover:scale-110"
			/>

			{count && Number(count) > 0 && (
				<span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-semibold text-black">
					{count}
				</span>
			)}
		</button>
	);
};
