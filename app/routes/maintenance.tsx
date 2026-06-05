import type { MetaFunction } from '@remix-run/cloudflare';
import { Button } from '~/shared/components/ui/button';

export const meta: MetaFunction = () => {
	return [
		{ title: 'Dompetku - Under Maintenance' },
		{ name: 'description', content: 'Our app is currently undergoing maintenance.' },
	];
};

export default function Maintenance() {
	return (
		<div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 text-center">
			<div className="max-w-md space-y-6">
				<div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
					<svg
						className="h-12 w-12 text-primary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						></path>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						></path>
					</svg>
				</div>

				<h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">We'll be right back!</h1>

				<p className="text-lg text-gray-600 dark:text-gray-300">
					We are currently updating our systems to serve you better. Please check back in a few minutes.
				</p>

				<div className="pt-4 border-t border-gray-200 dark:border-gray-800">
					<p className="text-sm text-gray-500 mb-2">Need urgent assistance?</p>
					<a href="mailto:hello@treonstudio.com" className="text-primary hover:underline font-medium">
						hello@treonstudio.com
					</a>
				</div>

				<div className="mt-8 pt-12">
					<a
						href="/signin"
						className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
					>
						Admin Login
					</a>
				</div>
			</div>
		</div>
	);
}
