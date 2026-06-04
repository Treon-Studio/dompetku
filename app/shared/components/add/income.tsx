'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'debounce';

import { addIncome, editIncome } from '~/features/income/api.client';
import { useResourceForm } from '~/shared/hooks/use-resource-form';
import { toast } from 'sonner';

import AutoCompleteList from '~/shared/components/autocomplete-list';
import { useUser } from '~/features/auth/components/auth-provider';
import CircleLoader from '~/shared/components/loader/circle';
import Modal from '~/shared/components/modal';
import { Button } from '~/shared/components/ui/button';
import { Input } from '~/shared/components/ui/input';
import { Label } from '~/shared/components/ui/label';
import { Textarea } from '~/shared/components/ui/textarea';

import { formatInputPrice, getCurrencySymbol, parseInputPrice } from '~/shared/lib/formatter';

import { incomeCategory } from '~/shared/constants/categories';
import { datePattern } from '~/shared/constants/date';

interface AddIncomeProps {
	show: boolean;
	selected: any;
	onHide: () => void;
	mutate: () => void;
	lookup: (value: any) => void;
}

const initialState = {
	category: '',
	date: '',
	name: '',
	notes: '',
	price: '',
	autocomplete: [],
};

export default function AddIncome({ show, onHide, mutate, selected, lookup }: AddIncomeProps) {
	const user = useUser();
	const { state, setState, loading, inputRef, onSubmit, todayDate, t } = useResourceForm({
		initialState,
		selected,
		onHide,
		mutate,
		api: { add: addIncome, edit: editIncome }
	});

	const onLookup = useMemo(() => {
		const callbackHandler = (value: string) => {
			setState((prev: any) => ({ ...prev, autocomplete: lookup(value) }));
		};
		return debounce(callbackHandler, 500);
	}, [lookup]);

	return (
		<Modal someRef={inputRef} show={show} title={selected.id ? t('income.editIncome') : t('income.addIncome')} onHide={onHide}>
			<div className="sm:flex sm:items-start max-sm:pb-6">
				<form
					className="md:[420px] grid w-full grid-cols-1 items-center gap-3"
					onSubmit={(event) => {
						event.preventDefault();
						onSubmit();
					}}
				>
					<div className="relative">
						<Label htmlFor="name">{t('income.source')}</Label>
						<Input
							id="name"
							className="mt-1.5"
							placeholder="Salary"
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
									setState({ ...state, name: '', category: '', autocomplete: [] });
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
							onClick={({ name, category }) => {
								setState({ ...state, name, category, autocomplete: [] });
							}}
							show={Boolean(state.autocomplete?.length)}
						/>
					</div>
					<div className="grid grid-cols-[32%_38%_30%] gap-1">
						<div className="mr-3">
							<Label htmlFor="amount">
								{t('income.amount')}
								<span className="ml-2 font-mono text-xs text-muted-foreground">
									({getCurrencySymbol(user.currency, user.locale)})
								</span>
							</Label>
							<Input
								className="mt-1.5"
								id="amount"
								type="text"
								placeholder="199"
								required
								inputMode="decimal"
								onChange={(event) => setState({ ...state, price: parseInputPrice(event.target.value) })}
								value={formatInputPrice(state.price)}
							/>
						</div>
						<div className="mr-3">
							<Label htmlFor="date">{t('income.date')}</Label>
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
						<div className="mr-3">
							<Label htmlFor="category">{t('income.category')}</Label>
							<select
								id="category"
								className="mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
								onChange={(event) => {
									setState({ ...state, category: event.target.value });
								}}
								value={state.category}
								required
							>
								{Object.keys(incomeCategory).map((categoryKey) => {
									return (
										<option key={categoryKey} value={categoryKey}>
											{incomeCategory[categoryKey]}
										</option>
									);
								})}
							</select>
						</div>
					</div>
					<div>
						<Label className="block">
							{t('income.notes')} <span className="text-center text-sm text-muted-foreground">{t('common.optional')}</span>
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
