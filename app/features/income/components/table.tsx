'use client';

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import Add from '~/shared/components/add-button';
import { useUser } from '~/features/auth/components/auth-provider';
import { useData } from '~/shared/components/context/data-provider';
import DataTable from '~/shared/components/table/data-table';

import { lookup } from '~/shared/lib/lookup';

import { incomeCategory } from '~/shared/constants/categories';
import messages from '~/shared/constants/messages';

import { IncomeData, deleteIncome } from '../api.client';
import { columns } from './columns';

const categories = Object.keys(incomeCategory)
	.filter(Boolean)
	.map((categoryKey) => ({
		label: incomeCategory[categoryKey],
		value: categoryKey,
	}));

export default function IncomeTable() {
	const [selected, setSelected] = useState({});
	const { data, loading, filter, mutate } = useData();
	const user = useUser();

	const onDelete = useCallback(
		async (id: string) => {
			try {
				await deleteIncome(id);
				toast.success(messages.deleted);
				mutate();
			} catch {
				toast.error(messages.error);
			}
		},
		[mutate]
	);

	const onEdit = useCallback(async (data: IncomeData | any) => {
		setSelected(data);
	}, []);

	const onHide = useCallback(() => {
		setSelected({});
	}, []);

	const onLookup = useCallback((name: string) => lookup({ data, name }), [data]);

	return (
		<>
			<DataTable
				options={{ user, onDelete, onEdit }}
				filter={filter}
				columns={columns}
				data={data}
				loading={loading}
				filename="Income"
				categories={categories}
			/>
			<Add onHide={onHide} onLookup={onLookup} selected={selected} mutate={mutate} type="income" />
		</>
	);
}
