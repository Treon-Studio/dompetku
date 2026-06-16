import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	email: text("email").unique(),
	phone: text("phone").unique(),
	password: text("password").notNull(),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
	currency: text("currency").default("INR").notNull(),
	locale: text("locale").default("en").notNull(),
	order_identifier: text("order_identifier"),
	order_store_id: text("order_store_id"),
	order_number: text("order_number"),
	order_status: text("order_status"),
	billing_start_date: text("billing_start_date"),
	plan_status: text("plan_status").default("basic").notNull(),
	trial_start_date: text("trial_start_date").default(sql`CURRENT_TIMESTAMP`),
	usage: integer("usage").default(0).notNull(),
	basic_usage_limit_email: integer("basic_usage_limit_email", { mode: "boolean" }).default(false).notNull(),
	new_signup_email: integer("new_signup_email", { mode: "boolean" }).default(false).notNull(),
	premium_plan_expired_email: integer("premium_plan_expired_email", { mode: "boolean" }).default(false).notNull(),
	premium_usage_limit_email: integer("premium_usage_limit_email", { mode: "boolean" }).default(false).notNull(),
	monthly_email_report: integer("monthly_email_report", { mode: "boolean" }).default(false).notNull(),
	role: text("role").default("USER").notNull(),
});

// ─── Sessions ────────────────────────────────────────────────────────────────
export const sessions = sqliteTable("sessions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	expires_at: text("expires_at").notNull(),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ─── Password Resets ─────────────────────────────────────────────────────────
export const password_resets = sqliteTable("password_resets", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	expires_at: text("expires_at").notNull(),
	used: integer("used", { mode: "boolean" }).default(false).notNull(),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expenses = sqliteTable("expenses", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	notes: text("notes"),
	price: text("price").default("0").notNull(),
	paid_via: text("paid_via").default("").notNull(),
	category: text("category").notNull(),
	date: text("date").notNull(),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
	user_id: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	nameHash: text("nameHash"),
});

// ─── Income ───────────────────────────────────────────────────────────────────
export const income = sqliteTable("income", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	notes: text("notes"),
	price: text("price").default("0").notNull(),
	category: text("category").notNull(),
	date: text("date").notNull(),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
	user_id: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	nameHash: text("nameHash"),
});

// ─── Investments ──────────────────────────────────────────────────────────────
export const investments = sqliteTable("investments", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	notes: text("notes"),
	price: text("price").default("0").notNull(),
	units: text("units").default("0").notNull(),
	category: text("category").notNull(),
	date: text("date").notNull(),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
	user_id: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	nameHash: text("nameHash"),
});

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptions = sqliteTable("subscriptions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	notes: text("notes"),
	url: text("url").notNull(),
	price: text("price").default("0").notNull(),
	paid: text("paid").notNull(),
	notify: integer("notify", { mode: "boolean" }).default(false).notNull(),
	date: text("date").notNull(),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
	user_id: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	active: integer("active", { mode: "boolean" }).default(true),
	cancelled_at: text("cancelled_at"),
	nameHash: text("nameHash"),
});

// ─── Feedbacks ────────────────────────────────────────────────────────────────
export const feedbacks = sqliteTable("feedbacks", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	message: text("message").notNull(),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	user_id: text("user_id").notNull(),
});

// ─── Contact ──────────────────────────────────────────────────────────────────
export const contact = sqliteTable("contact", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	message: text("message").notNull(),
	subject: text("subject").notNull(),
	email: text("email").notNull(),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ─── Friends ──────────────────────────────────────────────────────────────────
export const friends = sqliteTable("friends", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	user_id: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	slug: text("slug").notNull().unique(),
	is_public: integer("is_public", { mode: "boolean" }).default(true).notNull(),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ─── Debts ────────────────────────────────────────────────────────────────────
export const debts = sqliteTable("debts", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	type: text("type").notNull(),
	amount: text("amount").default("0").notNull(),
	status: text("status").default("UNPAID").notNull(),
	date: text("date").notNull(),
	notes: text("notes"),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
	friend_id: text("friend_id")
		.notNull()
		.references(() => friends.id, { onDelete: "cascade" }),
	user_id: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	nameHash: text("nameHash"),
});

// ─── Budgets ──────────────────────────────────────────────────────────────────
export const budgets = sqliteTable("budgets", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	category: text("category").notNull(),
	amount: text("amount").default("0").notNull(),
	month: text("month").notNull(),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
	user_id: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

// ─── Goals ────────────────────────────────────────────────────────────────────
export const goals = sqliteTable("goals", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	target_amount: text("target_amount").default("0").notNull(),
	current_amount: text("current_amount").default("0").notNull(),
	deadline: text("deadline"),
	status: text("status").default("IN_PROGRESS").notNull(),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
	user_id: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

// ─── App Settings ─────────────────────────────────────────────────────────────
export const app_settings = sqliteTable("app_settings", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
	description: text("description"),
	updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Income = typeof income.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Friend = typeof friends.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type AppSetting = typeof app_settings.$inferSelect;
