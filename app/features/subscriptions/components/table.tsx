"use client";

import { useCallback, useState } from "react";

import { toast } from "sonner";
import { useUser } from "~/features/auth/components/auth-provider";
import Add from "~/shared/components/add-button";
import { useData } from "~/shared/components/context/data-provider";
import DataTable from "~/shared/components/table/data-table";
import messages from "~/shared/constants/messages";
import { sortByKey } from "~/shared/lib/extractor";
import { lookup } from "~/shared/lib/lookup";

import { deleteSubscription, editSubscription, type SubscriptionData } from "../api.client";
import { columns } from "./columns";

export default function SubscriptionsTable() {
	const [selected, setSelected] = useState({});
	const { data, loading, filter, mutate } = useData();
	const user = useUser();

	const onDelete = useCallback(
		async (id: string) => {
			if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
			try {
				await deleteSubscription(id);
				toast.success(messages.deleted);
				mutate();
			} catch {
				toast.error(messages.error);
			}
		},
		[mutate],
	);

	const onChange = useCallback(
		async (data: SubscriptionData | unknown) => {
			try {
				await editSubscription(data);
				toast.success(messages.updated);
				mutate();
			} catch {
				toast.error(messages.error);
			}
		},
		[mutate],
	);

	const onEdit = useCallback((data: SubscriptionData | unknown) => {
		setSelected(data);
	}, []);

	const onHide = useCallback(() => {
		setSelected({});
	}, []);

	const onLookup = useCallback((name: string) => lookup({ data, name }), [data]);

	return (
		<>
			<DataTable
				options={{ user, onDelete, onEdit, onChange }}
				filter={filter}
				columns={columns}
				data={sortByKey(sortByKey(data, "renewal_date"), "active")}
				loading={loading}
				filename="Subscriptions"
				hideViewOptions
			/>
			<Add onHide={onHide} onLookup={onLookup} selected={selected} mutate={mutate} type="subscriptions" />
		</>
	);
}
