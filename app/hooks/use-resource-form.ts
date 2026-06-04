import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTranslation } from '@i18n/client';
import { dateFormat } from '~/constants/date';
import messages from '~/constants/messages';
import { incrementUsage } from '~/components/dashboard/apis';

interface UseResourceFormOptions {
	initialState: any;
	selected: any;
	onHide: () => void;
	mutate?: () => void;
	api: {
		add: (data: any) => Promise<any>;
		edit: (data: any) => Promise<any>;
	};
}

export function useResourceForm({ initialState, selected, onHide, mutate, api }: UseResourceFormOptions) {
	const { t } = useTranslation();
	const todayDate = format(new Date(), dateFormat);
	const [state, setState] = useState<any>({ ...initialState, date: todayDate });
	const [loading, setLoading] = useState(false);
	const inputRef = useRef<any>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		setState(
			selected?.id
				? { ...initialState, ...selected, paid_via: selected.paid_via || initialState.paid_via }
				: { ...initialState, date: todayDate }
		);
	}, [selected, todayDate]);

	const onSubmit = async () => {
		try {
			setLoading(true);
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
			setState({ ...initialState });
		} catch (error) {
			setLoading(false);
			toast.error(messages.error);
		}
	};

	return {
		state,
		setState,
		loading,
		inputRef,
		onSubmit,
		todayDate,
		t,
	};
}
