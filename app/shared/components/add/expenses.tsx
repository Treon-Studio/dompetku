"use client";

import debounce from "debounce";
import { useMemo } from "react";
import { useUser } from "~/features/auth/components/auth-provider";
import { addExpense, editExpense } from "~/features/expenses/api.client";
import AutoCompleteList from "~/shared/components/autocomplete-list";
import CircleLoader from "~/shared/components/loader/circle";
import Modal from "~/shared/components/modal";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Textarea } from "~/shared/components/ui/textarea";
import { expensesCategory, expensesPay, groupedExpenses } from "~/shared/constants/categories";
import { datePattern } from "~/shared/constants/date";
import { useResourceForm } from "~/shared/hooks/use-resource-form";
import { formatInputPrice, getCurrencySymbol, parseInputPrice } from "~/shared/lib/formatter";

interface ExpenseState {
	category: string;
	paid_via: string;
	name: string;
	notes: string;
	price: string;
	date: string;
	id?: string | null;
	autocomplete?: Record<string, unknown>[];
}

interface AddExpenseProps {
	show: boolean;
	selected: Partial<ExpenseState> & { id?: string | null };
	onHide: () => void;
	mutate: () => void;
	lookup: (value: string) => Record<string, unknown>[];
}

const initialState: ExpenseState = {
	category: "food",
	paid_via: "upi",
	name: "",
	notes: "",
	price: "",
	date: "",
	id: null,
	autocomplete: [],
};

export default function AddExpense({ show, onHide, mutate, selected, lookup }: AddExpenseProps) {
	const user = useUser();
	const { state, setState, loading, errors, inputRef, onSubmit, todayDate, t } = useResourceForm<ExpenseState>({
		initialState,
		selected,
		onHide,
		mutate,
		api: { add: addExpense, edit: editExpense },
	});

	const onLookup = useMemo(() => {
		const callbackHandler = (value: string) => {
			setState((prev) => ({ ...prev, autocomplete: lookup(value) }));
		};

		return debounce(callbackHandler, 500);
	}, [lookup, setState]);

	return (
		<Modal
			someRef={inputRef}
			show={show}
			title={selected.id ? t("expenses.editExpense") : t("expenses.addExpense")}
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
						<Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>
							{t("expenses.name")}
						</Label>
						<Input
							className={`mt-1.5 ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
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
									setState({ ...state, name: "", category: "food", paid_via: "upi" });
								}
							}}
							value={state.name}
						/>
						{errors.name && <p className="mt-1 text-xs text-destructive">{errors.name[0]}</p>}
						<AutoCompleteList
							onHide={() => {
								setState({ ...state, autocomplete: [] });
							}}
							data={state.autocomplete || []}
							searchTerm={state.name.length > 2 ? state.name.toLowerCase() : ""}
							onClick={({ name, category, paid_via }) => {
								setState({ ...state, name, category, paid_via, autocomplete: [] });
							}}
							show={Boolean(state.autocomplete?.length)}
						/>
					</div>
					<div className="grid grid-cols-[50%_50%] gap-3">
						<div className="mr-3">
							<Label htmlFor="price" className={errors.price ? "text-destructive" : ""}>
								{t("expenses.price")}
								<span className="ml-2 font-mono text-xs text-muted-foreground">
									({getCurrencySymbol(user?.currency, user?.locale)})
								</span>
							</Label>
							<Input
								className={`mt-1.5 ${errors.price ? "border-destructive focus-visible:ring-destructive" : ""}`}
								id="price"
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
							<Label htmlFor="date" className={errors.date ? "text-destructive" : ""}>
								{t("expenses.spentDate")}
							</Label>
							<Input
								className={`mt-1.5 appearance-none ${
									errors.date ? "border-destructive focus-visible:ring-destructive" : ""
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
					</div>
					<div className="grid grid-cols-[50%_50%] gap-3">
						<div className="mr-3">
							<Label htmlFor="category" className={errors.category ? "text-destructive" : ""}>
								{t("expenses.category")}
							</Label>
							<select
								id="category"
								className={`mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 ${
									errors.category
										? "border-destructive focus-visible:ring-destructive"
										: "border-input focus-visible:ring-ring"
								}`}
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
								<option key={"other"} value={"other"}>
									{expensesCategory.other.name}
								</option>
							</select>
							{errors.category && <p className="mt-1 text-xs text-destructive">{errors.category[0]}</p>}
						</div>
						<div className="mr-3">
							<Label htmlFor="paid" className={errors.paid_via ? "text-destructive" : ""}>
								{t("expenses.paidVia")}
							</Label>
							<select
								id="paid"
								className={`mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 ${
									errors.paid_via
										? "border-destructive focus-visible:ring-destructive"
										: "border-input focus-visible:ring-ring"
								}`}
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
							{errors.paid_via && <p className="mt-1 text-xs text-destructive">{errors.paid_via[0]}</p>}
						</div>
					</div>
					<div>
						<Label className={`block ${errors.notes ? "text-destructive" : ""}`}>
							{t("expenses.notes")}{" "}
							<span className="text-center text-sm text-muted-foreground">{t("common.optional")}</span>
						</Label>
						<Textarea
							className={`mt-2 h-20 ${errors.notes ? "border-destructive focus-visible:ring-destructive" : ""}`}
							onChange={(event) => setState({ ...state, notes: event.target.value })}
							value={state.notes}
							maxLength={60}
						/>
						{errors.notes && <p className="mt-1 text-xs text-destructive">{errors.notes[0]}</p>}
					</div>

					<Button disabled={loading} className="mt-1.5" type="submit">
						{loading ? <CircleLoader /> : selected?.id ? t("common.update") : t("common.submit")}
					</Button>
				</form>
			</div>
		</Modal>
	);
}
