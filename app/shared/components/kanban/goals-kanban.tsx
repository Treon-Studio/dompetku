"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "~/features/auth/components/auth-provider";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function GoalsKanban() {
	const user = useUser();
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ["goals"],
		queryFn: () => fetcher(`/api/goals`),
	});

	const updateGoalMutation = useMutation({
		mutationFn: async (updatedGoal: any) => {
			const formData = new FormData();
			formData.append("id", updatedGoal.id);
			formData.append("name", updatedGoal.name);
			formData.append("target_amount", updatedGoal.target_amount);
			formData.append("current_amount", updatedGoal.current_amount);
			if (updatedGoal.deadline) formData.append("deadline", updatedGoal.deadline);
			formData.append("status", updatedGoal.status);

			const res = await fetch("/api/goals", { method: "PUT", body: formData });
			return res.json();
		},
		onSuccess: (result: any) => {
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ["goals"] });
				toast.success("Goal updated successfully");
			} else {
				toast.error(result.error || "Failed to update goal");
			}
		},
		onError: () => {
			toast.error("Failed to update goal");
		},
	});

	const goals = (data as any)?.goals || [];

	const inProgressGoals = goals.filter((g: any) => g.status !== "ACHIEVED");
	const achievedGoals = goals.filter((g: any) => g.status === "ACHIEVED");

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat(user?.locale || "en-US", {
			style: "currency",
			currency: user?.currency || "USD",
		}).format(value);
	};

	const [draggedGoal, setDraggedGoal] = useState<any | null>(null);

	const handleDragStart = (e: React.DragEvent, goal: any) => {
		setDraggedGoal(goal);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (e: React.DragEvent, newStatus: string) => {
		e.preventDefault();
		if (draggedGoal && draggedGoal.status !== newStatus) {
			const updatedGoal = { ...draggedGoal, status: newStatus };
			if (newStatus === "ACHIEVED") {
				updatedGoal.current_amount = updatedGoal.target_amount;
			}
			updateGoalMutation.mutate(updatedGoal);
		}
		setDraggedGoal(null);
	};

	if (isLoading) {
		return <div className="animate-pulse h-32 bg-card rounded-xl"></div>;
	}

	const renderCard = (goal: any) => {
		const target = parseFloat(goal.target_amount);
		const current = parseFloat(goal.current_amount);
		const percentage = Math.min(100, Math.round((current / target) * 100));

		return (
			<div
				key={goal.id}
				draggable
				onDragStart={(e) => handleDragStart(e, goal)}
				className="p-4 bg-background border rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-primary transition-colors"
			>
				<h4 className="font-semibold">{goal.name}</h4>
				<p className="text-sm text-muted-foreground mt-1">
					{formatCurrency(current)} / {formatCurrency(target)}
				</p>
				<div className="w-full bg-primary/20 rounded-full h-1.5 mt-3 overflow-hidden">
					<div
						className={`h-full transition-all ${goal.status === "ACHIEVED" ? "bg-green-500" : "bg-primary"}`}
						style={{ width: `${percentage}%` }}
					/>
				</div>
			</div>
		);
	};

	return (
		<div className="mt-8">
			<h2 className="mb-4 font-semibold text-primary dark:text-white">Savings Goals Tracker</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* In Progress Column */}
				<div
					className="bg-card p-4 rounded-xl border border-dashed border-border flex flex-col gap-3 min-h-[200px]"
					onDragOver={handleDragOver}
					onDrop={(e) => handleDrop(e, "IN_PROGRESS")}
				>
					<div className="flex justify-between items-center mb-2">
						<h3 className="font-medium text-muted-foreground">In Progress</h3>
						<span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">{inProgressGoals.length}</span>
					</div>
					{inProgressGoals.map(renderCard)}
					{inProgressGoals.length === 0 && (
						<div className="text-center py-6 text-sm text-muted-foreground">No goals in progress.</div>
					)}
				</div>

				{/* Achieved Column */}
				<div
					className="bg-card p-4 rounded-xl border border-dashed border-green-500/30 flex flex-col gap-3 min-h-[200px]"
					onDragOver={handleDragOver}
					onDrop={(e) => handleDrop(e, "ACHIEVED")}
				>
					<div className="flex justify-between items-center mb-2">
						<h3 className="font-medium text-green-600">Achieved 🎉</h3>
						<span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">{achievedGoals.length}</span>
					</div>
					{achievedGoals.map(renderCard)}
					{achievedGoals.length === 0 && (
						<div className="text-center py-6 text-sm text-muted-foreground">Drop a goal here to mark as achieved!</div>
					)}
				</div>
			</div>
		</div>
	);
}
