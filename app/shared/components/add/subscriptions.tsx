"use client";

import debounce from "debounce";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "~/features/auth/components/auth-provider";
import { addSubscription, editSubscription } from "~/features/subscriptions/api.client";
import AutoCompleteList from "~/shared/components/autocomplete-list";
import CircleLoader from "~/shared/components/loader/circle";
import Modal from "~/shared/components/modal";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Textarea } from "~/shared/components/ui/textarea";
import { subscriptionCategory } from "~/shared/constants/categories";
import { datePattern } from "~/shared/constants/date";
import { useResourceForm } from "~/shared/hooks/use-resource-form";
import { formatInputPrice, getCurrencySymbol, parseInputPrice } from "~/shared/lib/formatter";

const checkUrl = (urlString: string) => {
	let url: URL | undefined;
	try {
		url = new URL(urlString);
	} catch (_) {
		return false;
	}
	return url.protocol === "http:" || url.protocol === "https:";
};

interface AddSubscriptions {
	show: boolean;
	selected: any;
	onHide: () => void;
	mutate: () => void;
	lookup: (name: string) => void;
}

const initialState = {
	date: "",
	name: "",
	notes: "",
	url: "",
	price: "",
	paid: "monthly",
};

export default function AddSubscriptions({ show, onHide, mutate, selected, lookup }: AddSubscriptions) {
	const user = useUser();
	const { state, setState, loading, inputRef, onSubmit, todayDate, t } = useResourceForm({
		initialState,
		selected,
		onHide,
		mutate,
		api: { add: addSubscription, edit: editSubscription },
	});
	const [hasValidUrl, setHasValidUrl] = useState(false);

	useEffect(() => setHasValidUrl(checkUrl(state.url)), [state.url]);

	const onLookup = useMemo(() => {
		const callbackHandler = (value: string) => {
			setState((prev: any) => ({ ...prev, autocomplete: lookup(value) }));
		};
		return debounce(callbackHandler, 500);
	}, [lookup, setState]);

	return (
		<Modal
			someRef={inputRef}
			show={show}
			title={selected.id ? t("subscriptions.editSubscription") : t("subscriptions.addSubscription")}
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
						<Label htmlFor="name">{t("subscriptions.title")}</Label>
						<Input
							className="mt-1.5"
							id="name"
							placeholder="Netflix or Amazon Prime"
							maxLength={30}
							required
							ref={inputRef}
							autoFocus
							autoComplete="off"
							onChange={({ target }) => {
								const { value } = target;
								if (value.length) {
									setState({ ...state, name: value });
									if (value.length > 2) onLookup(value);
								} else {
									setState({ ...state, name: "", paid: "monthly" });
								}
							}}
							value={state.name}
						/>
						<AutoCompleteList
							onHide={() => {
								setState({ ...state, autocomplete: [] });
							}}
							data={state.autocomplete}
							searchTerm={state.name.length > 2 ? state.name.toLowerCase() : ""}
							onClick={({ name, paid, url }) => {
								setState({ ...state, name, paid, url, autocomplete: [] });
							}}
							show={Boolean(state.autocomplete?.length)}
						/>
					</div>
					<div className="grid grid-cols-[100%] gap-1">
						<Label className="flex grow-0 items-center" htmlFor="website">
							{t("subscriptions.website")}
							{hasValidUrl && state.url ? (
								<img
									src={`http://www.google.com/s2/favicons?domain=${state.url}&sz=125`}
									width={15}
									height={15}
									alt={state?.name}
									className="ml-2"
								/>
							) : null}
						</Label>
						<Input
							className="mt-1.5"
							id="website"
							type="url"
							inputMode="url"
							pattern="https://.*|http://.*"
							maxLength={2000}
							placeholder="https://netflix.com"
							required
							onChange={(event) => setState({ ...state, url: event.target.value })}
							value={state.url}
						/>
					</div>
					<div className="grid grid-cols-[34%_36%_30%] gap-1">
						<div className="mr-3">
							<Label htmlFor="price">
								{t("subscriptions.price")}
								<span className="ml-2 font-mono text-xs text-muted-foreground">
									({getCurrencySymbol(user?.currency, user?.locale)})
								</span>
							</Label>
							<Input
								className="mt-1.5"
								id="price"
								inputMode="decimal"
								type="text"
								placeholder="199"
								required
								onChange={(event) => setState({ ...state, price: parseInputPrice(event.target.value) })}
								value={formatInputPrice(state.price)}
							/>
						</div>
						<div className="mr-3">
							<Label htmlFor="date">{t("subscriptions.startDate")}</Label>
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
							<Label htmlFor="paying">{t("subscriptions.billingCycle")}</Label>
							<select
								id="paying"
								className="mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
								onChange={(event) => {
									setState({ ...state, paid: event.target.value });
								}}
								value={state.paid}
								required
							>
								{Object.keys(subscriptionCategory).map((key) => {
									return (
										<option key={key} value={key}>
											{subscriptionCategory[key].name}
										</option>
									);
								})}
							</select>
						</div>
					</div>
					<div>
						<Label className="block">
							{t("subscriptions.notes")}{" "}
							<span className="text-center text-sm text-muted-foreground">{t("common.optional")}</span>
						</Label>
						<Textarea
							className="mt-2 h-20"
							onChange={(event) => setState({ ...state, notes: event.target.value })}
							value={state.notes}
							maxLength={60}
						/>
					</div>

					<Button disabled={loading} className="mt-2" type="submit">
						{loading ? <CircleLoader /> : selected?.id ? t("common.update") : t("common.submit")}
					</Button>
				</form>
			</div>
		</Modal>
	);
}
