'use client';

import { Link } from '@remix-run/react';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

type SidebarLinkProps = {
	href: string;
	name?: string;
	children: any;
	active?: boolean;
	className?: string;
	shortcut?: string;
	onClick?: () => void;
};

export default function SidebarLink({
	href,
	name = '',
	children,
	active,
	className = '',
	shortcut,
	onClick,
}: SidebarLinkProps) {
	return (
		<>
			{shortcut ? (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="block">
							<Link
								onClick={() => {
									if (onClick) onClick();
								}}
								to={href}
								className={`mb-1.5 mt-1.5 flex items-center justify-center rounded-lg p-2 tracking-wide text-white transition-all hover:bg-[#27272a] ${
									active ? 'bg-[#27272a]' : ''
								} ${className}`}
							>
								{children}
							</Link>
						</span>
					</TooltipTrigger>
					<TooltipContent side="right">
						{name}
						<kbd className="border-gray ml-[6px] inline-flex h-[19px] w-[19px] items-center justify-center rounded-[4px] border border-gray-400 text-xs font-semibold uppercase">
							{shortcut}
						</kbd>
					</TooltipContent>
				</Tooltip>
			) : (
				<Link
					onClick={() => {
						if (onClick) onClick();
					}}
					to={href}
					className={`mb-1.5 mt-1.5 flex items-center justify-center rounded-lg p-2 tracking-wide text-white transition-all hover:bg-[#27272a] ${
						active ? 'bg-[#27272a]' : ''
					} ${className}`}
				>
					{children}
				</Link>
			)}
		</>
	);
}
