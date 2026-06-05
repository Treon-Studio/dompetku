import { useEffect, useState } from 'react';

import { CheckCircle, ChatRoundLine } from '@solar-icons/react';
import { toast } from 'sonner';

import { Button } from '~/shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/shared/components/ui/popover';
import { Textarea } from '~/shared/components/ui/textarea';

import { apiUrls } from '~/shared/lib/apiUrls';
import { cn } from '~/shared/lib/utils';

import messages, { emails } from '~/shared/constants/messages';

export default function Feedback({ className, showDatePicker }: { className?: string; showDatePicker: boolean }) {
	const [state, setState] = useState({ show: false, loading: false, message: '', sent: false });

	useEffect(() => {
		if (state.sent) {
			const timer = setTimeout(() => {
				setState((prev) => ({ ...prev, sent: false, show: false }));
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [state.sent]);

	const onSubmit = async () => {
		setState({ ...state, loading: true });

		try {
			const res = await fetch(apiUrls.feedback.add, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: state.message }),
			});

			if (!res.ok) {
				const error = (await res.json()) as { message?: string };
				throw new Error(error.message || res.statusText);
			}

			setState((prev) => ({ ...prev, sent: true, loading: false, message: '' }));
		} catch (e: unknown) {
			const error = e as Error;
			setState((prev) => ({ ...prev, loading: false }));
			toast.error(emails.feedback.failed);
		}
	};

	return (
		<Popover>
			<PopoverTrigger>
				<Button className={`${className} max-sm:h-9 max-sm:text-sm`} asChild size={'sm'}>
					<span>
						<ChatRoundLine className="mr-[6px] mt-[2px] h-4 w-4" />
						Feedback
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className={`z-10 mr-1 h-[160px] w-[290px] rounded-md border border-border bg-popover p-4 shadow-xs sm:mt-2 ${cn(
					{ 'mt-[-18px]': showDatePicker, 'mt-[20px]': !showDatePicker }
				)} `}
			>
				{!state.sent ? (
					<form
						onSubmit={(event) => {
							event.preventDefault();
							onSubmit();
						}}
					>
						<Textarea
							onChange={(event) => setState({ ...state, message: event.target.value })}
							value={state.message}
							placeholder="Share your feedback here"
							className="h-[90px] resize-none"
							required
						/>
						<Button disabled={state.loading} size={'sm'} className="float-right mt-[10px]">
							Send
						</Button>
					</form>
				) : (
					<div className="flex h-[140px] flex-col items-center justify-center">
						<CheckCircle className="mb-2 h-12 w-12 text-green-500" />
						<span className="mb-1 mt-1 block text-sm font-semibold text-primary">Got your feedback</span>
						<span className="mb-3 block text-sm font-normal text-muted-foreground">
							Thanks for improving the product.
						</span>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
