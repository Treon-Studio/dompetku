import { DataContextProvider } from '~/shared/components/context/data-provider';
import LayoutHeader from '~/shared/components/layout/header';

import InvestmentsSummary from './summary';
import DataTable from './table';

const title = 'Dompetku - Investments';
const description = 'Effortlessly Track and Manage Expenses.';

export const metadata = {
	title,
	description,
};

export default async function Page() {
	return (
		<>
			<LayoutHeader title="investments" />
			<DataContextProvider name="investments">
				<div className="w-full overflow-x-auto p-4 pt-3">
					<InvestmentsSummary />
					<DataTable />
				</div>
			</DataContextProvider>
		</>
	);
}
