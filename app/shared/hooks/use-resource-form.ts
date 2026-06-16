import { useTranslation } from "@i18n/client";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { incrementUsage } from "~/shared/components/dashboard/apis";
import { dateFormat } from "~/shared/constants/date";
import messages from "~/shared/constants/messages";

interface UseResourceFormOptions<T> {
	initialState: T;
	selected: Partial<T> & { id?: string | null };
	onHide: () => void;
	mutate?: () => void;
	api: {
		add: (data: T) => Promise<any>;
		edit: (data: T) => Promise<any>;
	};
}

export function useResourceForm<T extends Record<string, any>>({
	initialState,
	selected,
	onHide,
	mutate,
	api,
}: UseResourceFormOptions<T>) {
	const { t } = useTranslation();
	const todayDate = format(new Date(), dateFormat);
	const [state, setState] = useState<T>({ ...initialState, date: todayDate } as T);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string[]>>({});
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		setState(
			selected?.id
				? ({
						...initialState,
						...selected,
						paid_via: (selected as any).paid_via || (initialState as any).paid_via,
					} as T)
				: ({ ...initialState, date: todayDate } as T),
		);
		setErrors({});
	}, [selected, todayDate, initialState]);

	const onSubmit = async () => {
		try {
			setLoading(true);
			setErrors({});
			const isEditing = Boolean(selected?.id);
			if (isEditing) {
				await api.edit(state);
			} else {
				await api.add(state);
				incrementUsage();
			}
			setLoading(false);
			toast.success(isEditing ? messages.updated : messages.success);
			if (mutate) mutate();
			onHide();
			setState({ ...initialState, date: todayDate } as T);
		} catch (error: any) {
			setLoading(false);
			if (error.data?.errors) {
				setErrors(error.data.errors);
				toast.error(error.message || messages.error);
			} else {
				toast.error(error.message || messages.error);
			}
		}
	};

	return {
		state,
		setState,
		loading,
		errors,
		setErrors,
		inputRef,
		onSubmit,
		todayDate,
		t,
	};
}
