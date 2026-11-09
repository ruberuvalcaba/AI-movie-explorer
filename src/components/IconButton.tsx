import { useNavigate, useRouter } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

type IconButtonProps = {
	title?: string;
	count?: number | string;
	icon: LucideIcon;
	route?: string;
	goBack?: boolean;
	type?: "button" | "submit" | "reset";
};

export const IconButton = ({
	title = "",
	icon: Icon,
	count,
	route,
	goBack = false,
	type = "button",
}: IconButtonProps) => {
	const navigate = useNavigate();
	const router = useRouter();
	console.log(count, "count");
	return (
		<button
			type={type}
			onClick={
				goBack
					? () => router.history.back()
					: route
						? () => navigate({ to: route })
						: undefined
			}
			aria-label={`${title}${count ? `, ${count} items` : ""}`}
			title={title}
			className="cursor-pointer group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
		>
			<Icon
				size={18}
				strokeWidth={1.8}
				className="transition-transform duration-200 group-hover:scale-110 text-yellow-400"
			/>

			{Number(count) >= 0 && (
				<span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-semibold text-black">
					{Number(count) > 99 ? "99+" : count}
				</span>
			)}
		</button>
	);
};
