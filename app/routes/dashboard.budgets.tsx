import type { MetaFunction } from '@remix-run/cloudflare';
import BudgetsView from '~/features/budgets/components/budgets-view';

export const meta: MetaFunction = () => {
	return [{ title: 'Dompetku - Budgets' }];
};

export default function BudgetsPage() {
	return <BudgetsView />;
}
