import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const url = process.env.TURSO_DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;

if (!url) throw new Error('TURSO_DATABASE_URL is not set');

const client = createClient({ url, authToken });
const db = drizzle(client, { schema });

const TEST_EMAIL = 'demo@dompetku';
const TEST_PHONE = '+6281234567890';
const TEST_PASSWORD = 'password123';

function uuid() {
	return crypto.randomUUID();
}

async function main() {
	console.log('Starting seed...\n');

	// Delete existing demo users
	await db.delete(schema.users).where(eq(schema.users.email, TEST_EMAIL));
	await db.delete(schema.users).where(eq(schema.users.phone, TEST_PHONE));

	const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

	// Create email user
	const emailUserId = uuid();
	await db.insert(schema.users).values({
		id: emailUserId,
		email: TEST_EMAIL,
		password: passwordHash,
		currency: 'IDR',
		locale: 'id',
		plan_status: 'premium',
		role: 'ADMIN',
	});
	console.log(`Created email user (ADMIN): ${TEST_EMAIL}`);

	// Create phone user
	const phoneUserId = uuid();
	await db.insert(schema.users).values({
		id: phoneUserId,
		phone: TEST_PHONE,
		password: passwordHash,
		currency: 'IDR',
		locale: 'id',
		plan_status: 'basic',
	});
	console.log(`Created phone user: ${TEST_PHONE}`);

	// Seed expenses for email user
	const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05'];
	const expenseData = [
		{ name: 'Belanja Bulanan', category: 'groceries', price: '850000', paid_via: 'qris' },
		{ name: 'Makan Siang', category: 'food', price: '125000', paid_via: 'cash' },
		{ name: 'Netflix', category: 'entertainment', price: '54000', paid_via: 'credit_card' },
		{ name: 'Bensin Motor', category: 'transport', price: '60000', paid_via: 'cash' },
		{ name: 'Tagihan Listrik', category: 'utilities', price: '320000', paid_via: 'transfer' },
		{ name: 'Internet Rumah', category: 'utilities', price: '299000', paid_via: 'transfer' },
		{ name: 'Obat & Vitamin', category: 'health', price: '180000', paid_via: 'qris' },
		{ name: 'Kopi', category: 'food', price: '45000', paid_via: 'qris' },
	];

	let expenseCount = 0;
	for (const month of months) {
		for (const exp of expenseData) {
			const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
			await db.insert(schema.expenses).values({
				id: uuid(),
				name: exp.name,
				category: exp.category,
				price: exp.price,
				paid_via: exp.paid_via,
				date: `${month}-${day}`,
				user_id: emailUserId,
			});
			expenseCount++;
		}
	}
	console.log(`Created ${expenseCount} expense records`);

	// Income
	let incomeCount = 0;
	for (const month of months) {
		await db.insert(schema.income).values({
			id: uuid(),
			name: 'Gaji Bulanan',
			category: 'salary',
			price: '8500000',
			date: `${month}-01`,
			user_id: emailUserId,
		});
		incomeCount++;

		if (month === '2025-03' || month === '2025-05') {
			await db.insert(schema.income).values({
				id: uuid(),
				name: 'Freelance Project',
				category: 'freelance',
				price: '2000000',
				date: `${month}-20`,
				user_id: emailUserId,
			});
			incomeCount++;
		}
		if (month === '2025-04') {
			await db.insert(schema.income).values({
				id: uuid(),
				name: 'Bonus Kinerja',
				category: 'bonus',
				price: '1500000',
				date: `${month}-15`,
				user_id: emailUserId,
			});
			incomeCount++;
		}
	}
	console.log(`Created ${incomeCount} income records`);

	// Investments
	const investmentData = [
		{ name: 'Reksa Dana Saham', category: 'stocks', price: '500000', units: '10' },
		{ name: 'Emas Antam', category: 'gold', price: '1000000', units: '1' },
		{ name: 'Reksa Dana Pasar Uang', category: 'mutual_funds', price: '300000', units: '5' },
	];

	let invCount = 0;
	for (const month of months) {
		for (const inv of investmentData) {
			const day = String(Math.floor(Math.random() * 15) + 1).padStart(2, '0');
			await db.insert(schema.investments).values({
				id: uuid(),
				name: inv.name,
				category: inv.category,
				price: inv.price,
				units: inv.units,
				date: `${month}-${day}`,
				user_id: emailUserId,
			});
			invCount++;
		}
	}
	console.log(`Created ${invCount} investment records`);

	// Subscriptions
	const subsData = [
		{ name: 'Netflix', url: 'https://netflix.com', price: '54000', paid: 'monthly' },
		{ name: 'Spotify', url: 'https://spotify.com', price: '54990', paid: 'monthly' },
		{ name: 'iCloud 50GB', url: 'https://icloud.com', price: '15000', paid: 'monthly' },
		{ name: 'GitHub Pro', url: 'https://github.com', price: '40000', paid: 'monthly' },
		{ name: 'Figma', url: 'https://figma.com', price: '200000', paid: 'monthly' },
	];

	for (const sub of subsData) {
		await db.insert(schema.subscriptions).values({
			id: uuid(),
			name: sub.name,
			url: sub.url,
			price: sub.price,
			paid: sub.paid,
			date: '2025-01-01',
			active: true,
			user_id: emailUserId,
		});
	}
	console.log(`Created ${subsData.length} subscription records`);

	console.log('\nSeed complete!\n');
	console.log('-----------------------------------');
	console.log(`Email    : ${TEST_EMAIL}`);
	console.log(`Phone    : ${TEST_PHONE}`);
	console.log(`Password : ${TEST_PASSWORD}`);
	console.log('-----------------------------------\n');
}

main()
	.catch((e) => {
		console.error('Seed failed:', e);
		process.exit(1);
	})
	.finally(() => client.close());
