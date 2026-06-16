const fs = require("node:fs");

function replaceInFile(file, replacements) {
	let content = fs.readFileSync(file, "utf8");
	for (const [oldStr, newStr] of replacements) {
		content = content.split(oldStr).join(newStr);
	}
	fs.writeFileSync(file, content);
}

// 1. debts-view.tsx
replaceInFile("app/features/debts/components/debts-view.tsx", [
	[
		'import { formatInputPrice, parseInputPrice } from "~/shared/lib/formatter";',
		'import { formatInputPrice, parseInputPrice } from "~/shared/lib/formatter";\ntype DebtItem = { id: string; name: string; amount: string; status: string; type: string; date: string; };\ntype FriendItem = { id: string; name: string; slug: string; is_public: boolean; debts: DebtItem[]; };',
	],
	["friendsData as any[]", "friendsData as FriendItem[]"],
	["(f: any)", "(f: FriendItem)"],
	["(d: any)", "(d: DebtItem)"],
	["<any>", "<FriendItem | null>"],
	["(friend: any)", "(friend: FriendItem)"],
	["(debt: any)", "(debt: DebtItem)"],
]);

// 2. profile/api.server.ts
replaceInFile("app/features/profile/api.server.ts", [
	["body: any", "body: Record<string, string | undefined>"],
	["updateData: Record<string, any>", "updateData: Record<string, string | boolean | null>"],
	["plan_status as any", 'plan_status as "basic" | "premium"'],
	["order_status as any", 'order_status as "pending" | "paid" | "failed"'],
]);

// 3. admin.settings.tsx
replaceInFile("app/routes/admin.settings.tsx", [
	["settings as any[]", "settings as Record<string, string>[]"],
	["(s: any)", "(s: Record<string, string>)"],
	["(await res.json()) as any", "(await res.json()) as { message: string }"],
	["(flag: any)", "(flag: Record<string, string>)"],
	[
		'<label className="text-xs font-semibold mb-1 block">Flag Key</label>',
		'<label htmlFor="flagKey" className="text-xs font-semibold mb-1 block">Flag Key</label>',
	],
	[
		'<label className="text-xs font-semibold mb-1 block">Description</label>',
		'<label htmlFor="flagDesc" className="text-xs font-semibold mb-1 block">Description</label>',
	],
]);

console.log("Fixes applied via script.");
