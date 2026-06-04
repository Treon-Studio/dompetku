'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { addInvestment, editInvestment } from '~/features/investments/api.client';
import { useResourceForm } from '~/shared/hooks/use-resource-form';
import debounce from 'debounce';

import AutoCompleteList from '~/shared/components/autocomplete-list';
import { useUser } from '~/features/auth/components/auth-provider';
import CircleLoader from '~/shared/components/loader/circle';
import Modal from '~/shared/components/modal';
import { Button } from '~/shared/components/ui/button';
import { Input } from '~/shared/components/ui/input';
import { Label } from '~/shared/components/ui/label';
import { Textarea } from '~/shared/components/ui/textarea';
import { useTranslation } from '@i18n/client';

import { formatInputPrice, getCurrencySymbol, parseInputPrice } from '~/shared/lib/formatter';

import { investmentCategory } from '~/shared/constants/categories';
import { datePattern } from '~/shared/constants/date';

interface AddInvestments {
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
	units: '',
	autocomplete: [],
};

export default function AddInvestments({ show, onHide, mutate, selected, lookup }: AddInvestments) {
	const user = useUser();
	const { state, setState, loading, inputRef, onSubmit, todayDate, t } = useResourceForm({
		initialState,
		selected,
		onHide,
		mutate,
		api: { add: addInvestment, edit: editInvestment },
	});

	const onLookup = useMemo(() => {
		const callbackHandler = (value: string) => {
			setState((prev: any) => ({ ...prev, autocomplete: lookup(value) }));
		};
		return debounce(callbackHandler, 500);
	}, [lookup, setState]);

	return (
		<Modal someRef={inputRef} show={show} title={selected.id ? t('investments.editInvestment') : t('investments.addInvestment')} onHide={onHide}>
			<div className="sm:flex sm:items-start max-sm:pb-6">
				<form
					className="md:[420px] grid w-full grid-cols-1 items-center gap-3"
					onSubmit={(event) => {
						event.preventDefault();
						onSubmit();
					}}
				>
					<div className="relative">
						<Label htmlFor="name">{t('investments.title')}</Label>
						<Input
							className="mt-1.5"
							id="name"
							placeholder="Name or $TSLA"
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
					<div className="grid grid-cols-[50%_50%] gap-1">
						<div className="mr-3">
							<Label htmlFor="price">
								{t('investments.price')}
								<span className="ml-2 font-mono text-xs text-muted-foreground">
									({getCurrencySymbol(user.currency, user.locale)})
								</span>
							</Label>
							<Input
								className="mt-1.5"
								id="price"
								inputMode="decimal"
								type="text"
								placeholder="1000"
								required
								onChange={(event) => setState({ ...state, price: parseInputPrice(event.target.value) })}
								value={formatInputPrice(state.price)}
							/>
						</div>
						<div className="mr-3">
							<Label htmlFor="units">{t('investments.units')}</Label>
							<Input
								className="mt-1.5"
								id="units"
								type="text"
								inputMode="decimal"
								placeholder="10"
								required
								onChange={(event) => setState({ ...state, units: parseInputPrice(event.target.value) })}
								value={formatInputPrice(state.units)}
							/>
						</div>
					</div>
					<div className="grid grid-cols-[50%_50%] gap-1">
						<div className="mr-3">
							<Label htmlFor="date">{t('investments.date')}</Label>
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
							<Label htmlFor="category">{t('investments.type')}</Label>
							<select
								id="category"
								className="mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
								onChange={(event) => {
									setState({ ...state, category: event.target.value });
								}}
								value={state.category}
								required
							>
								{Object.keys(investmentCategory).map((categoryKey) => {
									return (
										<option key={categoryKey} value={categoryKey}>
											{investmentCategory[categoryKey]}
										</option>
									);
								})}
							</select>
						</div>
					</div>
					<div>
						<Label className="mt-1 block">
							{t('investments.notes')} <span className="mb-6 text-center text-sm text-muted-foreground">{t('common.optional')}</span>
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
