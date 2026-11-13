import type { ReactElement } from "react";

type BadgeProps = {
	label?: string;
	icon?: ReactElement;
};

export const Badge = ({ label, icon }: BadgeProps) => {
	return (
		<div className="flex items-center gap-2 rounded bg-white/[0.07] px-3 py-1 text-sm text-white/60 backdrop-blur-xl">
			{icon && icon}
			{label && <span>{label}</span>}
		</div>
	);
};
