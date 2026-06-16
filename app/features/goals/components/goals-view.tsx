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
import { formatInputPrice, parseInputPrice } from "~/shared/lib/formatter";

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<{ goals: Record<string, string>[] }>);

export default function GoalsView() {
	const user = useUser();
	const { data, refetch, isLoading } = useQuery({
		queryKey: ["goals"],
		queryFn: () => fetcher(`/api/goals`),
	});

	const goals = data?.goals || [];
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAddingFunds, setIsAddingFunds] = useState<string | null>(null);

	const [name, setName] = useState("");
	const [targetAmount, setTargetAmount] = useState("");
	const [deadline, setDeadline] = useState("");
	const [fundAmount, setFundAmount] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name || !targetAmount) {
			toast.error("Name and target amount are required");
			return;
		}

		setIsSubmitting(true);
		const formData = new FormData();
		formData.append("name", name);
		formData.append("target_amount", parseInputPrice(targetAmount).toString());
		if (deadline) formData.append("deadline", deadline);

		try {
			const res = await fetch("/api/goals", {
				method: "POST",
				body: formData,
			});
			const result = (await res.json()) as { success: boolean; error?: string };

			if (result.success) {
				toast.success("Goal saved successfully");
				setIsOpen(false);
				setName("");
				setTargetAmount("");
				setDeadline("");
				refetch();
			} else {
				toast.error(result.error || "Failed to save goal");
			}
		} catch (_error) {
			toast.error("An unexpected error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAddFunds = async (e: React.FormEvent, goal: Record<string, unknown>) => {
		e.preventDefault();
		const amountToAdd = Number(parseInputPrice(fundAmount));
		if (Number.isNaN(amountToAdd) || amountToAdd <= 0) return;

		const current = parseFloat(goal.current_amount);
		const newTotal = current + amountToAdd;
		const target = parseFloat(goal.target_amount);
		const newStatus = newTotal >= target ? "ACHIEVED" : "IN_PROGRESS";

		const formData = new FormData();
		formData.append("id", goal.id);
		formData.append("name", goal.name);
		formData.append("target_amount", goal.target_amount);
		formData.append("current_amount", newTotal.toString());
		if (goal.deadline) formData.append("deadline", goal.deadline);
		formData.append("status", newStatus);

		try {
			const res = await fetch("/api/goals", { method: "PUT", body: formData });
			const result = (await res.json()) as { success: boolean; error?: string };
			if (result.success) {
				toast.success("Funds added successfully!");
				setIsAddingFunds(null);
				setFundAmount("");
				refetch();
			} else {
				toast.error(result.error || "Failed to add funds");
			}
		} catch (_error) {
			toast.error("An unexpected error occurred");
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this goal?")) return;
		const formData = new FormData();
		formData.append("id", id);

		try {
			const res = await fetch("/api/goals", { method: "DELETE", body: formData });
			const result = (await res.json()) as { success: boolean; error?: string };
			if (result.success) {
				toast.success("Goal deleted");
				refetch();
			} else {
				toast.error(result.error || "Failed to delete goal");
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
			<LayoutHeader title="Savings Goals" />
			<div className="p-4 md:p-6 space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<h2 className="text-2xl font-semibold tracking-tight text-primary">Your Goals</h2>
						<p className="text-sm text-muted-foreground">
							Track your progress towards big purchases or savings targets
						</p>
					</div>
					<Button onClick={() => setIsOpen(true)}>Add Goal</Button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{isLoading ? (
						<p>Loading goals...</p>
					) : goals.length === 0 ? (
						<div className="col-span-full text-center py-12 border border-dashed rounded-lg">
							<p className="text-muted-foreground">No goals set yet.</p>
							<Button variant="outline" className="mt-4" onClick={() => setIsOpen(true)}>
								Create your first goal
							</Button>
						</div>
					) : (
						goals.map((goal: Record<string, string>) => {
							const target = parseFloat(goal.target_amount);
							const current = parseFloat(goal.current_amount);
							const percentage = Math.min(100, Math.round((current / target) * 100));

							return (
								<div
									key={goal.id}
									className={`p-4 border rounded-xl bg-card shadow-sm space-y-4 ${goal.status === "ACHIEVED" ? "border-green-500" : ""}`}
								>
									<div className="flex justify-between items-start">
										<div>
											<h3 className="font-semibold text-lg">{goal.name}</h3>
											<p className="text-sm text-muted-foreground">
												{formatCurrency(current)} / {formatCurrency(target)}
											</p>
											{goal.deadline && (
												<p className="text-xs text-muted-foreground mt-1">
													Target: {new Date(goal.deadline).toLocaleDateString()}
												</p>
											)}
										</div>
										<Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(goal.id)}>
											Delete
										</Button>
									</div>
									<div className="space-y-1">
										<Progress
											value={percentage}
											className="h-2"
											indicatorColor={percentage >= 100 ? "bg-green-500" : "bg-primary"}
										/>
										<p className="text-xs text-right font-medium text-muted-foreground">{percentage}% completed</p>
									</div>

									{goal.status !== "ACHIEVED" && (
										<div className="pt-2">
											{isAddingFunds === goal.id ? (
												<form onSubmit={(e) => handleAddFunds(e, goal)} className="flex gap-2">
													<Input
														autoFocus
														placeholder="Amount"
														value={fundAmount}
														onChange={(e) => setFundAmount(formatInputPrice(e.target.value))}
														className="h-8 text-sm"
													/>
													<Button type="submit" size="sm" className="h-8">
														Add
													</Button>
													<Button
														type="button"
														size="sm"
														variant="ghost"
														className="h-8"
														onClick={() => setIsAddingFunds(null)}
													>
														Cancel
													</Button>
												</form>
											) : (
												<Button
													variant="outline"
													size="sm"
													className="w-full"
													onClick={() => setIsAddingFunds(goal.id)}
												>
													Add Funds
												</Button>
											)}
										</div>
									)}
									{goal.status === "ACHIEVED" && (
										<div className="pt-2 text-center text-sm font-semibold text-green-600 bg-green-50 rounded p-1">
											🎉 Goal Achieved!
										</div>
									)}
								</div>
							);
						})
					)}
				</div>
			</div>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create a Savings Goal</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4 mt-4">
						<div className="space-y-2">
							<Label>Goal Name</Label>
							<Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Laptop" />
						</div>

						<div className="space-y-2">
							<Label>Target Amount</Label>
							<Input
								required
								value={targetAmount}
								onChange={(e) => setTargetAmount(formatInputPrice(e.target.value))}
								placeholder="0.00"
							/>
						</div>

						<div className="space-y-2">
							<Label>Target Date (Optional)</Label>
							<Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
						</div>

						<div className="flex justify-end gap-2 pt-4">
							<Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Saving..." : "Save Goal"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
