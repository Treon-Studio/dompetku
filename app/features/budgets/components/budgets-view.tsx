"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "~/features/auth/components/auth-provider";
import LayoutHeader from "~/shared/components/layout/header";
import { Button } from "~/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/shared/components/ui/dialog";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Progress } from "~/shared/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/shared/components/ui/select";
import { groupedExpenses } from "~/shared/constants/categories";
import { formatInputPrice, parseInputPrice } from "~/shared/lib/formatter";

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<{ budgets: unknown[] }>);

export default function BudgetsView() {
	const user = useUser();
	const currentMonth = new Date().toISOString().slice(0, 7);

	const { data, refetch, isLoading } = useQuery({
		queryKey: ["budgets", currentMonth],
		queryFn: () => fetcher(`/api/budgets?month=${currentMonth}`),
	});

	const budgets = data?.budgets || [];
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [category, setCategory] = useState("");
	const [amount, setAmount] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!category || !amount) {
			toast.error("Category and amount are required");
			return;
		}

		setIsSubmitting(true);
		const formData = new FormData();
		formData.append("category", category);
		formData.append("amount", parseInputPrice(amount).toString());
		formData.append("month", currentMonth);

		try {
			const res = await fetch("/api/budgets", {
				method: "POST",
				body: formData,
			});
			const result = (await res.json()) as { success: boolean; error?: string };

			if (result.success) {
				toast.success("Budget saved successfully");
				setIsOpen(false);
				setCategory("");
				setAmount("");
				refetch();
			} else {
				toast.error(result.error || "Failed to save budget");
			}
		} catch (_error) {
			toast.error("An unexpected error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this budget?")) return;

		const formData = new FormData();
		formData.append("id", id);

		try {
			const res = await fetch("/api/budgets", {
				method: "DELETE",
				body: formData,
			});
			const result = (await res.json()) as { success: boolean };
			if (result.success) {
				toast.success("Budget deleted");
				refetch();
			} else {
				toast.error(result.error || "Failed to delete budget");
			}
		} catch (_error) {
			toast.error("An unexpected error occurred");
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat(user?.locale || "en-US", {
			style: "currency",
			currency: user?.currency || "USD",
		}).format(value);
	};

	return (
		<>
			<LayoutHeader title="Budgets" />
			<div className="p-4 md:p-6 space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<h2 className="text-2xl font-semibold tracking-tight text-primary">Monthly Budgets</h2>
						<p className="text-sm text-muted-foreground">Manage your spending limits for {currentMonth}</p>
					</div>
					<Button onClick={() => setIsOpen(true)}>Add Budget</Button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{isLoading ? (
						<p>Loading budgets...</p>
					) : budgets.length === 0 ? (
						<div className="col-span-full text-center py-12 border border-dashed rounded-lg">
							<p className="text-muted-foreground">No budgets set for this month.</p>
							<Button variant="outline" className="mt-4" onClick={() => setIsOpen(true)}>
								Create your first budget
							</Button>
						</div>
					) : (
						budgets.map((budget: { id: string; category: string; amount: string; spent?: number }) => {
							const budgetAmount = parseFloat(budget.amount);
							const spentAmount = budget.spent || 0;
							const percentage = Math.min(100, Math.round((spentAmount / budgetAmount) * 100));

							let progressColor = "bg-primary";
							if (percentage >= 100) progressColor = "bg-red-500";
							else if (percentage >= 80) progressColor = "bg-yellow-500";

							return (
								<div key={budget.id} className="p-4 border rounded-xl bg-card shadow-sm space-y-4">
									<div className="flex justify-between items-start">
										<div>
											<h3 className="font-semibold text-lg capitalize">{budget.category}</h3>
											<p className="text-sm text-muted-foreground">
												{formatCurrency(spentAmount)} / {formatCurrency(budgetAmount)}
											</p>
										</div>
										<Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(budget.id)}>
											Delete
										</Button>
									</div>
									<div className="space-y-1">
										<Progress value={percentage} className="h-2" indicatorColor={progressColor} />
										<p className="text-xs text-right text-muted-foreground">{percentage}% used</p>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Set Budget for {currentMonth}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4 mt-4">
						<div className="space-y-2">
							<Label>Category</Label>
							<Select value={category} onValueChange={setCategory}>
								<SelectTrigger>
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(groupedExpenses).map(([groupKey, group]) => (
										<optgroup key={groupKey} label={group.name} className="p-1 font-semibold text-muted-foreground">
											{Object.entries(group.list).map(([catKey, cat]) => (
												<SelectItem key={catKey} value={catKey}>
													<span className="flex items-center gap-2">
														<span>{(cat as { emoji: string; name: string }).emoji}</span>
														<span>{cat.name}</span>
													</span>
												</SelectItem>
											))}
										</optgroup>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Budget Amount</Label>
							<Input
								required
								value={amount}
								onChange={(e) => setAmount(formatInputPrice(e.target.value))}
								placeholder="0.00"
							/>
						</div>

						<div className="flex justify-end gap-2 pt-4">
							<Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Saving..." : "Save Budget"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
