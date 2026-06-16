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
	const { state, setState, loading, errors, inputRef, onSubmit, todayDate, t } = useResourceForm({
		initialState,
		selected,
		onHide,
		mutate,
		api: { add: addIncome, edit: editIncome },
	});

	const onLookup = useMemo(() => {
		const callbackHandler = (value: string) => {
			setState((prev: any) => ({ ...prev, autocomplete: lookup(value) }));
		};
		return debounce(callbackHandler, 500);
	}, [lookup]);

	return (
		<Modal
			someRef={inputRef}
			show={show}
			title={selected.id ? t('income.editIncome') : t('income.addIncome')}
			onHide={onHide}
		>
			<div className="sm:flex sm:items-start max-sm:pb-6">
				<form
					className="md:[420px] grid w-full grid-cols-1 items-center gap-3"
					onSubmit={(event) => {
						event.preventDefault();
						onSubmit();
					}}
				>
					<div className="relative">
						<Label htmlFor="name" className={errors.name ? 'text-destructive' : ''}>
							{t('income.source')}
						</Label>
						<Input
							id="name"
							className={`mt-1.5 ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
						{errors.name && <p className="mt-1 text-xs text-destructive">{errors.name[0]}</p>}
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
							<Label htmlFor="amount" className={errors.price ? 'text-destructive' : ''}>
								{t('income.amount')}
								<span className="ml-2 font-mono text-xs text-muted-foreground">
									({getCurrencySymbol(user?.currency, user?.locale)})
								</span>
							</Label>
							<Input
								className={`mt-1.5 ${errors.price ? 'border-destructive focus-visible:ring-destructive' : ''}`}
								id="amount"
								type="text"
								placeholder="199"
								required
								inputMode="decimal"
								onChange={(event) => setState({ ...state, price: parseInputPrice(event.target.value) })}
								value={formatInputPrice(state.price)}
							/>
							{errors.price && <p className="mt-1 text-xs text-destructive">{errors.price[0]}</p>}
						</div>
						<div className="mr-3">
							<Label htmlFor="date" className={errors.date ? 'text-destructive' : ''}>
								{t('income.date')}
							</Label>
							<Input
								className={`mt-1.5 appearance-none ${
									errors.date ? 'border-destructive focus-visible:ring-destructive' : ''
								}`}
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
							{errors.date && <p className="mt-1 text-xs text-destructive">{errors.date[0]}</p>}
						</div>
						<div className="mr-3">
							<Label htmlFor="category" className={errors.category ? 'text-destructive' : ''}>
								{t('income.category')}
							</Label>
							<select
								id="category"
								className={`mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 ${
									errors.category
										? 'border-destructive focus-visible:ring-destructive'
										: 'border-input focus-visible:ring-ring'
								}`}
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
							{errors.category && <p className="mt-1 text-xs text-destructive">{errors.category[0]}</p>}
						</div>
					</div>
					<div>
						<Label className={`block ${errors.notes ? 'text-destructive' : ''}`}>
							{t('income.notes')}{' '}
							<span className="text-center text-sm text-muted-foreground">{t('common.optional')}</span>
						</Label>
						<Textarea
							className={`mt-2 h-20 ${errors.notes ? 'border-destructive focus-visible:ring-destructive' : ''}`}
							onChange={(event) => setState({ ...state, notes: event.target.value })}
							value={state.notes}
							maxLength={60}
						/>
						{errors.notes && <p className="mt-1 text-xs text-destructive">{errors.notes[0]}</p>}
					</div>

					<Button disabled={loading} className="mt-1.5" type="submit">
						{loading ? <CircleLoader /> : selected?.id ? t('common.update') : t('common.submit')}
					</Button>
				</form>
			</div>
		</Modal>
	);
}
