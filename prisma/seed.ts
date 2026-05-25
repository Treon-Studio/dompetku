import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.TURSO_DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;

if (!url) throw new Error('TURSO_DATABASE_URL is not set');

const client = createClient({ url, authToken });

const TEST_EMAIL = 'demo@dompetku';
const TEST_PHONE = '+6281234567890';
const TEST_PASSWORD = 'password123';

function uuid() {
  return crypto.randomUUID();
}

async function ensureTables() {
  console.log('Ensuring tables exist...');

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      phone TEXT,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      currency TEXT DEFAULT 'IDR',
      locale TEXT DEFAULT 'id',
      order_identifier TEXT,
      order_store_id TEXT,
      order_number TEXT,
      order_status TEXT,
      billing_start_date TEXT,
      plan_status TEXT DEFAULT 'basic',
      trial_start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      usage INTEGER DEFAULT 0,
      basic_usage_limit_email INTEGER DEFAULT 0,
      new_signup_email INTEGER DEFAULT 0,
      premium_plan_expired_email INTEGER DEFAULT 0,
      premium_usage_limit_email INTEGER DEFAULT 0,
      monthly_email_report INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      notes TEXT,
      price TEXT DEFAULT '0',
      paid_via TEXT DEFAULT '',
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT NOT NULL,
      nameHash TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS income (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      notes TEXT,
      price TEXT DEFAULT '0',
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT NOT NULL,
      nameHash TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      notes TEXT,
      price TEXT DEFAULT '0',
      units TEXT DEFAULT '0',
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT NOT NULL,
      nameHash TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      notes TEXT,
      url TEXT NOT NULL,
      price TEXT DEFAULT '0',
      paid TEXT NOT NULL,
      notify INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      cancelled_at TEXT,
      nameHash TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      subject TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.executeMultiple(`
    CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
    CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
    CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
  `);

  console.log('Tables ready\n');
}

async function migrateColumns() {
  console.log('Running migrations...');

  try {
    await client.execute(`ALTER TABLE users ADD COLUMN phone TEXT UNIQUE`);
    console.log('Added phone column to users');
  } catch {
    console.log('phone column already exists, skipping');
  }

  try {
    await client.execute(`CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    console.log('Created password_resets table');
  } catch {
    console.log('password_resets table already exists, skipping');
  }

  console.log('Migrations done\n');
}

async function main() {
  console.log('Starting seed...\n');

  await ensureTables();
  await migrateColumns();

  // Delete existing demo users
  await client.execute({
    sql: 'DELETE FROM users WHERE email = ?',
    args: [TEST_EMAIL],
  });
  await client.execute({
    sql: 'DELETE FROM users WHERE phone = ?',
    args: [TEST_PHONE],
  });

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  // Create email user
  const emailUserId = uuid();
  await client.execute({
    sql: `INSERT INTO users (id, email, phone, password, currency, locale, plan_status)
          VALUES (?, ?, NULL, ?, 'IDR', 'id', 'premium')`,
    args: [emailUserId, TEST_EMAIL, passwordHash],
  });
  console.log(`Created email user: ${TEST_EMAIL}`);

  // Create phone user
  const phoneUserId = uuid();
  await client.execute({
    sql: `INSERT INTO users (id, email, phone, password, currency, locale, plan_status)
          VALUES (?, NULL, ?, ?, 'IDR', 'id', 'basic')`,
    args: [phoneUserId, TEST_PHONE, passwordHash],
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
      await client.execute({
        sql: `INSERT INTO expenses (id, name, category, price, paid_via, date, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [uuid(), exp.name, exp.category, exp.price, exp.paid_via, `${month}-${day}`, emailUserId],
      });
      expenseCount++;
    }
  }
  console.log(`Created ${expenseCount} expense records`);

  // Income
  let incomeCount = 0;
  for (const month of months) {
    await client.execute({
      sql: `INSERT INTO income (id, name, category, price, date, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [uuid(), 'Gaji Bulanan', 'salary', '8500000', `${month}-01`, emailUserId],
    });
    incomeCount++;

    if (month === '2025-03' || month === '2025-05') {
      await client.execute({
        sql: `INSERT INTO income (id, name, category, price, date, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [uuid(), 'Freelance Project', 'freelance', '2000000', `${month}-20`, emailUserId],
      });
      incomeCount++;
    }
    if (month === '2025-04') {
      await client.execute({
        sql: `INSERT INTO income (id, name, category, price, date, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [uuid(), 'Bonus Kinerja', 'bonus', '1500000', `${month}-15`, emailUserId],
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
      await client.execute({
        sql: `INSERT INTO investments (id, name, category, price, units, date, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [uuid(), inv.name, inv.category, inv.price, inv.units, `${month}-${day}`, emailUserId],
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
    await client.execute({
      sql: `INSERT INTO subscriptions (id, name, url, price, paid, date, active, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [uuid(), sub.name, sub.url, sub.price, sub.paid, '2025-01-01', 1, emailUserId],
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
