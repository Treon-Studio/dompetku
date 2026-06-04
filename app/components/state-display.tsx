import { Inbox, Danger } from '@solar-icons/react';

import { cn } from '~/lib/utils';

type StateDisplayProps = {
	variant: 'empty' | 'error';
	title?: string;
	description?: string;
	icon?: React.ReactNode;
	action?: React.ReactNode;
	className?: string;
};

const defaults: Record<string, { title: string; icon: React.ReactNode }> = {
	empty: {
		title: 'No data',
		icon: <Inbox className="h-10 w-10" />,
	},
	error: {
		title: 'Something went wrong',
		icon: <Danger className="h-10 w-10" />,
	},
};

export default function StateDisplay({
	variant,
	title,
	description,
	icon,
	action,
	className,
}: StateDisplayProps) {
	const config = defaults[variant];

	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center gap-2 text-center text-muted-foreground',
				className
			)}
		>
			<div className="mb-1 opacity-50">{icon ?? config.icon}</div>
			<p className="text-sm font-medium text-foreground">{title ?? config.title}</p>
			{description && <p className="text-sm">{description}</p>}
			{action && <div className="mt-2">{action}</div>}
		</div>
	);
}
