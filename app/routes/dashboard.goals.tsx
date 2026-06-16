import type { MetaFunction } from "@remix-run/cloudflare";
import GoalsView from "~/features/goals/components/goals-view";

export const meta: MetaFunction = () => {
	return [{ title: "Dompetku - Savings Goals" }];
};

export default function GoalsPage() {
	return <GoalsView />;
}
