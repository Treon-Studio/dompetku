'use client';

import { useEffect } from 'react';
import { logException } from '~/core/firebase.client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
	useEffect(() => {
		console.error('Client error', { error: error.message, stack: error.stack });
		logException(error.message, true);
	}, [error]);

	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="text-center">
				<h2 className="mb-2 text-xl font-semibold">Something went wrong!</h2>
				<button
					onClick={() => reset()}
					className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Try again
				</button>
			</div>
		</div>
	);
}
