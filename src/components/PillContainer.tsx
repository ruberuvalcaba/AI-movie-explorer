import type { ReactElement } from "react";

type PillContainerProps = {
	label: string;
	icon?: ReactElement;
};

export const PillContainer = ({ label, icon }: PillContainerProps) => {
	return (
		<div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/60 backdrop-blur-xl">
			{icon && icon}
			<span>{label}</span>
		</div>
	);
};
