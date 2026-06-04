'use client';

import { addExpense, editExpense } from '~/components/dashboard/expenses/apis';
import { useResourceForm } from '~/hooks/use-resource-form';
import debounce from 'debounce';

import AutoCompleteList from '~/components/autocomplete-list';
import { useUser } from '~/components/context/auth-provider';
import CircleLoader from '~/components/loader/circle';
import Modal from '~/components/modal';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { useTranslation } from '@i18n/client';

import { formatInputPrice, getCurrencySymbol, parseInputPrice } from '~/lib/formatter';

import { expensesCategory, expensesPay, groupedExpenses } from '~/constants/categories';
import { datePattern } from '~/constants/date';

interface AddExpenseProps {
	show: boolean;
	selected: any;
	onHide: () => void;
	mutate: () => void;
	lookup: (value: any) => void;
}

const initialState = {
	category: 'food',
	paid_via: 'upi',
	name: '',
	notes: '',
	price: '',
	date: '',
	id: null,
	autocomplete: [],
};

export default function AddExpense({ show, onHide, mutate, selected, lookup }: AddExpenseProps) {
	const user = useUser();
	const { state, setState, loading, inputRef, onSubmit, todayDate, t } = useResourceForm({
		initialState,
		selected,
		onHide,
		mutate,
		api: { add: addExpense, edit: editExpense },
	});

	const onLookup = useMemo(() => {
		const callbackHandler = (value: string) => {
			setState((prev: any) => ({ ...prev, autocomplete: lookup(value) }));
		};

		return debounce(callbackHandler, 500);
	}, [lookup, setState]);

	return (
		<Modal someRef={inputRef} show={show} title={selected.id ? t('expenses.editExpense') : t('expenses.addExpense')} onHide={onHide}>
			<div className="sm:flex sm:items-start max-sm:pb-6">
				<form
					className="md:[420px] grid w-full grid-cols-1 items-center gap-3"
					onSubmit={(event) => {
						event.preventDefault();
						onSubmit();
					}}
				>
					<div className="relative">
						<Label htmlFor="name">{t('expenses.name')}</Label>
						<Input
							className="mt-1.5"
							id="name"
							placeholder="Swiggy - Biriyani"
							maxLength={30}
							required
							ref={inputRef}
							autoFocus
							autoComplete="off"
							onChange={({ target }) => {
								const { value } = target;
								if (value.length) {
									setState({ ...state, name: value, autocomplete: [] });
									if (value.length > 2) onLookup(value);
								} else {
									setState({ ...state, name: '', category: 'food', paid_via: 'upi' });
								}
							}}
							value={state.name}
						/>
						<AutoCompleteList
							onHide={() => {
								setState({ ...state, autocomplete: [] });
							}}
							data={state.autocomplete}
							searchTerm={state.name.length > 2 ? state.name.toLowerCase() : ''}
							onClick={({ name, category, paid_via }) => {
								setState({ ...state, name, category, paid_via, autocomplete: [] });
							}}
							show={Boolean(state.autocomplete?.length)}
						/>
					</div>
					<div className="grid grid-cols-[50%_50%] gap-3">
						<div className="mr-3">
							<Label htmlFor="price">
								{t('expenses.price')}
								<span className="ml-2 font-mono text-xs text-muted-foreground">
									({getCurrencySymbol(user.currency, user.locale)})
								</span>
							</Label>
							<Input
								className="mt-1.5"
								id="price"
								type="text"
								placeholder="199"
								required
								inputMode="decimal"
								onChange={(event) => setState({ ...state, price: parseInputPrice(event.target.value) })}
								value={formatInputPrice(state.price)}
							/>
						</div>
						<div className="mr-3">
							<Label htmlFor="date">{t('expenses.spentDate')}</Label>
							<Input
								className="mt-1.5 appearance-none"
								id="date"
								type="date"
								required
								max={todayDate}
								pattern={datePattern}
								onChange={(event) => {
									setState({ ...state, date: event.target.value });
								}}
								value={state.date}
							/>
						</div>
					</div>
					<div className="grid grid-cols-[50%_50%] gap-3">
						<div className="mr-3">
							<Label htmlFor="category">{t('expenses.category')}</Label>
							<select
								id="category"
								className="mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
								onChange={(event) => {
									setState({ ...state, category: event.target.value });
								}}
								value={state.category}
								required
							>
								{Object.keys(groupedExpenses).map((key) => {
									return (
										<optgroup label={groupedExpenses[key].name} key={groupedExpenses[key].name}>
											{Object.keys(groupedExpenses[key].list).map((listKey) => {
												return (
													<option key={listKey} value={listKey}>
														{groupedExpenses[key].list[listKey].name}
													</option>
												);
											})}
										</optgroup>
									);
								})}
								<option key={'other'} value={'other'}>
									{expensesCategory.other.name}
								</option>
							</select>
						</div>
						<div className="mr-3">
							<Label htmlFor="paid">{t('expenses.paidVia')}</Label>
							<select
								id="paid"
								className="mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
								onChange={(event) => {
									setState({ ...state, paid_via: event.target.value });
								}}
								value={state.paid_via}
								required
							>
								{Object.keys(expensesPay).map((key) => {
									return (
										<option key={key} value={key}>
											{expensesPay[key].name}
										</option>
									);
								})}
							</select>
						</div>
					</div>
					<div>
						<Label className="block">
							{t('expenses.notes')} <span className="text-center text-sm text-muted-foreground">{t('common.optional')}</span>
						</Label>
						<Textarea
							className="mt-2 h-20"
							onChange={(event) => setState({ ...state, notes: event.target.value })}
							value={state.notes}
							maxLength={60}
						/>
					</div>

					<Button disabled={loading} className="mt-1.5" type="submit">
						{loading ? <CircleLoader /> : (selected?.id ? t('common.update') : t('common.submit'))}
					</Button>
				</form>
			</div>
		</Modal>
	);
}
