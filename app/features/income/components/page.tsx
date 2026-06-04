import { DataContextProvider } from '~/shared/components/context/data-provider';
import LayoutHeader from '~/shared/components/layout/header';

import IncomeSummary from './summary';
import IncomeTable from './table';

const title = 'Dompetku - Income';
const description = 'Effortlessly Track and Manage Expenses.';

export const metadata = {
	title,
	description,
};

export default async function Page() {
	return (
		<>
			<LayoutHeader title="income" />
			<DataContextProvider name="income">
				<div className="w-full overflow-x-auto p-4 pt-3">
					<IncomeSummary />
					<IncomeTable />
				</div>
			</DataContextProvider>
		</>
	);
}
