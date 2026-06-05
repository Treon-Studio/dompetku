import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { addDays, startOfMonth } from 'date-fns';

export type TDateRange = {
	readonly from: Date;
	readonly to: Date;
	readonly selected: string;
};

export type TDateState = {
	readonly date: TDateRange;
};

export type TDateActions = {
	readonly setDate: (state: Partial<TDateRange>) => void;
};

export const useDateStore = create<TDateState & TDateActions>()((set) => ({
	// Initial state
	date: {
		from: startOfMonth(new Date()),
		to: addDays(new Date(), 0),
		selected: 'm',
	},

	// Actions
	setDate: (state) =>
		set((s) => ({
			date: {
				...s.date,
				...state,
				selected: state?.selected ?? s.date.selected,
			},
		})),
}));

// Selectors
export const useDateRange = () => useDateStore((s) => s.date);
export const useDateActions = () => useDateStore(useShallow((s) => ({ setDate: s.setDate })));
