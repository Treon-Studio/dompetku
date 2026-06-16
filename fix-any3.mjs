import fs from "node:fs";

function replaceInFile(file, replacements) {
	let content = fs.readFileSync(file, "utf8");
	for (const [oldStr, newStr] of replacements) {
		content = content.split(oldStr).join(newStr);
	}
	fs.writeFileSync(file, content);
}

replaceInFile("app/routes/share.$slug.tsx", [
	[
		'const unpaidDebts = friend.debts.filter((debt: any) => debt.status === "UNPAID");',
		'const unpaidDebts = friend.debts.filter((debt: Record<string, string>) => debt.status === "UNPAID");',
	],
	[
		"const unpaidDebts = friend.debts.filter((debt: any) => debt.status === 'UNPAID');",
		"const unpaidDebts = friend.debts.filter((debt: Record<string, string>) => debt.status === 'UNPAID');",
	],
	[
		'const paidDebts = friend.debts.filter((debt: any) => debt.status === "PAID");',
		'const paidDebts = friend.debts.filter((debt: Record<string, string>) => debt.status === "PAID");',
	],
	[
		"const paidDebts = friend.debts.filter((debt: any) => debt.status === 'PAID');",
		"const paidDebts = friend.debts.filter((debt: Record<string, string>) => debt.status === 'PAID');",
	],
	["friend.debts.forEach((debt: any) => {", "friend.debts.forEach((debt: Record<string, string>) => {"],
	["{unpaidDebts.map((debt: any) => (", "{unpaidDebts.map((debt: Record<string, string>) => ("],
	["{paidDebts.map((debt: any) => (", "{paidDebts.map((debt: Record<string, string>) => ("],
]);

replaceInFile("app/shared/components/add/expenses.tsx", [
	["autocomplete?: any[];", "autocomplete?: Record<string, unknown>[];"],
	["lookup: (value: string) => any[];", "lookup: (value: string) => Record<string, unknown>[];"],
]);

replaceInFile("app/shared/components/add/investments.tsx", [
	["autocomplete?: any[];", "autocomplete?: Record<string, unknown>[];"],
	["lookup: (value: string) => any[];", "lookup: (value: string) => Record<string, unknown>[];"],
]);

replaceInFile("app/shared/components/add/subscriptions.tsx", [
	["autocomplete?: any[];", "autocomplete?: Record<string, unknown>[];"],
	["lookup: (name: string) => any[];", "lookup: (name: string) => Record<string, unknown>[];"],
	["setState((prev: any)", "setState((prev: SubscriptionState)"],
]);

replaceInFile("app/shared/components/chart/bar-list.tsx", [
	["useMemo<Array<any>>", "useMemo<Record<string, unknown>[]>"],
	["valueFormatter={(value: any) => {", "valueFormatter={(value: number) => {"],
]);

replaceInFile("app/shared/components/chart/bar.tsx", [
	["payload?: any;", "payload?: Record<string, unknown>[];"],
	["user: any", "user: Record<string, unknown>"],
	["(category: any, idx: number)", "(category: Record<string, unknown>, idx: number)"],
	["useMemo<Array<any>>", "useMemo<Record<string, unknown>[]>"],
]);

replaceInFile("app/shared/components/chart/donut.tsx", [
	["payload?: any;", "payload?: Record<string, unknown>[];"],
	["user: any", "user: Record<string, unknown>"],
	["useMemo<Array<any>>", "useMemo<Record<string, unknown>[]>"],
]);

replaceInFile("app/shared/lib/extractor.ts", [
	["<T extends Record<string, any>>", "<T extends Record<string, unknown>>"],
	["data.reduce<Record<string, any>>", "data.reduce<Record<string, Record<string, number>>>"],
]);

console.log("Fixes applied via ESM script 3.");
