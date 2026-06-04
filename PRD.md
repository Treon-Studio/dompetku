# Dompetku — Product Requirements Document

## 1. Overview

**Dompetku** is an open-source personal finance management application that allows users to track and manage incomes, investments, subscriptions, and expenses in one place. It provides data-driven insights, real-time visibility into spending habits, and helps identify overspending.

| Field | Value |
|-------|-------|
| **Type** | SaaS (Freemium) |
| **License** | AGPLv3 |
| **Repository** | https://github.com/gokulkrishh/expense.fyi |
| **Target Users** | Individuals seeking to manage personal finances |

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Remix v2 + Vite |
| UI Components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS |
| Charts | Tremor React |
| Tables | TanStack React Table |
| Database | SQLite (Prisma ORM with libSQL/Turso adapter) |
| Authentication | Email/password + bcryptjs + cookie sessions |
| Email | Resend |
| State Management | React Context + SWR |
| Date Handling | date-fns |
| Notifications | Sonner (toast) |
| Hosting | Vercel |

---

## 3. User Authentication

### 3.1 Sign Up
- Email + password (min 6 chars) + confirm password
- Server creates user with bcrypt-hashed password
- Session created (30-day cookie)
- Redirect to dashboard

### 3.2 Sign In
- Email lookup → bcrypt verify → create session → set cookie
- Protected routes redirect unauthenticated users to `/signin`

### 3.3 Session Management
- Cookie-based (`expense_session`) + DB-backed sessions table
- `requireUser()` loader middleware validates session and expiry

### 3.4 Sign Out
- Delete session from DB
- Destroy cookie
- Redirect to `/signin`

---

## 4. Data Model

### 4.1 Users
```
users
├── id (UUID)
├── email (unique)
├── password (hashed)
├── currency (default: INR)
├── locale (default: en)
├── plan_status (basic | premium)
├── usage (entry count)
├── billing_start_date
├── order_status
└── sessions[], expenses[], income[], investments[], subscriptions[]
```

### 4.2 Expenses
```
expenses
├── id, name, price, paid_via, category, date, notes
├── nameHash (lowercase, for autocomplete)
├── user_id (FK)
└── created_at, updated_at
```

### 4.3 Income
```
income
├── id, name, price, category, date, notes
├── nameHash
├── user_id (FK)
└── created_at, updated_at
```

### 4.4 Investments
```
investments
├── id, name, price, units, category, date, notes
├── nameHash
├── user_id (FK)
└── created_at, updated_at
```

### 4.5 Subscriptions
```
subscriptions
├── id, name, price, paid, notify, date
├── active, cancelled_at
├── nameHash
├── user_id (FK)
└── created_at, updated_at
```

### 4.6 Sessions
```
sessions
├── id, token (unique)
├── user_id (FK)
├── expires_at
└── created_at
```

---

## 5. Routes & Pages

### 5.1 Public Routes
| Route | Purpose |
|-------|---------|
| `/` | Landing page (marketing) |
| `/signin` | Sign in |
| `/signup` | Sign up |

### 5.2 Protected Routes (Dashboard)
| Route | Purpose |
|-------|---------|
| `/dashboard` | Overview with summary cards & charts |
| `/dashboard/expenses` | Expenses list and management |
| `/dashboard/income` | Income list and management |
| `/dashboard/investments` | Investments list and management |
| `/dashboard/subscriptions` | Subscriptions list and management |

---

## 6. Features & Functionality

### 6.1 Core Features

| Feature | Description |
|---------|-------------|
| **Expense Tracking** | Log expenses with name, price, category, payment method, date, notes |
| **Income Tracking** | Record income (salary, YouTube, passive income, etc.) |
| **Investment Tracking** | Track crypto, stocks, mutual funds with units |
| **Subscription Tracking** | Monitor recurring subscriptions with billing cycles |
| **Dashboard Overview** | Summary cards: income, balance, spent, investments, subscriptions |
| **Charts & Visualizations** | Bar charts for expenses, donut charts for subscriptions |
| **Date Filtering** | This Month, Last Month, This Year, All Time, or custom range |
| **Data Tables** | Sortable, filterable tables with edit/delete actions |
| **Autocomplete** | Smart suggestions when typing expense/income names |
| **Keyboard Shortcuts** | Quick navigation (1-5 menu, n new entry) |
| **Multi-currency** | User preference (default: INR) |
| **CSV Export** | Premium feature |
| **Usage Tracking** | Basic: 100 entries max, Premium: 2000 |

### 6.2 Expense Categories
`food`, `grocery`, `bills`, `entertainment`, `shopping`, `travel`, `rent`, `EMI`, `fuel`, `medical`, `education`, `insurance`, `recharge`, `gifts`, `other`

### 6.3 Payment Methods
`cash`, `creditcard`, `debitcard`, `ewallet`, `netbanking`, `upi`

### 6.4 Income Categories
`salary`, `youtube`, `passiveincome`, `ads`, `freelance`, `other`

### 6.5 Investment Categories
`crypto`, `indianstock`, `mutualfunds`, `usstock`, `other`

### 6.6 Subscription Billing Cycles
`monthly`, `yearly`

---

## 7. API Endpoints

### 7.1 Authentication
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/auth/signin` | POST | Sign in |
| `/api/auth/signup` | POST | Sign up |
| `/api/auth/signout` | POST | Sign out |

### 7.2 Data Management
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/expenses` | GET, PUT, DELETE | Get/update/delete expenses |
| `/api/expenses/add` | POST | Add expense |
| `/api/income` | GET, PUT, DELETE | Get/update/delete income |
| `/api/income/add` | POST | Add income |
| `/api/investments` | GET, PUT, DELETE | Get/update/delete investments |
| `/api/investments/add` | POST | Add investment |
| `/api/subscriptions` | GET, PUT, DELETE | Get/update/delete subscriptions |
| `/api/subscriptions/add` | POST | Add subscription |

### 7.3 User & Utility
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/user/usage` | POST | Increment usage counter |
| `/api/user/upgrade` | POST | Upgrade user to premium |
| `/api/feedback` | POST | Submit feedback |

---

## 8. Pricing Plans

| Plan | Price | Entry Limit | Features |
|------|-------|-------------|----------|
| **Basic** | Free | 100 | Expense/income/investment/subscription tracking, chart visualizations, email support |
| **Premium** | $20/year | 2000 | All Basic features + advanced charts, CSV export, priority support |

---

## 9. Key User Flows

### 9.1 Adding an Expense
1. Click **+** button or press `n` key
2. Modal opens: name, price, date, category, paid_via, notes
3. Type name (3+ chars) → autocomplete suggests matches
4. Submit → POST to `/api/expenses/add`
5. Toast confirmation, modal closes, table updates via SWR

### 9.2 Editing/Deleting Data
1. In table, click pencil icon (edit) or trash icon (delete)
2. Edit: Prefills modal → PUT to `/api/{type}`
3. Delete: Confirmation → DELETE to `/api/{type}`

---

## 10. Context Providers

| Provider | Purpose |
|----------|---------|
| `AuthProvider` | Current user + premium status |
| `ThemeProvider` | Dark/light mode |
| `SidebarContextProvider` | Mobile sidebar toggle |
| `DatePickerProvider` | Global date filter state |
| `DataContextProvider` | Per-type data fetching |
| `OverviewContextProvider` | Combined data for overview |

---

## 11. UI Components

| Component | Purpose |
|-----------|---------|
| `Sidebar` | Navigation with icons + hotkeys |
| `DashboardLayout` | Protected page wrapper |
| `Summary` | 5 summary cards |
| `Charts` | Bar chart, donut chart, recent activities |
| `AddData` | FAB that opens add modal |
| `AddExpense/Income/Investments/Subscriptions` | Add forms |
| `DataTable` | TanStack Table wrapper |
| `columns.tsx` | Column definitions per data type |

**shadcn/ui Library**: Button, Input, Label, Textarea, Calendar, Popover, Tooltip, Dialog, DropdownMenu, Switch, Checkbox, Select, Table, Badge, Separator, Skeleton, Sonner.

---

## 12. Notable Implementation Details

- **Hotkeys**: `1-5` for menu navigation, `n` for new entry
- **Autocomplete**: Debounced search via `nameHash` lowercase matching
- **Usage Enforcement**: Basic plan blocked at 100 entries
- **Premium Gating**: Recent Activities, Top Spent charts only for premium
- **SWR**: Client-side stale-while-revalidate data fetching
- **Privacy**: `nameHash` stores lowercase for efficient autocomplete
---

## 13. Epics & User Stories

### Epic 1: User Authentication & Profile Management
As a user, I want to securely create an account and manage my profile so that my financial data remains private and synchronized across devices.
- **US 1.1:** As a new user, I want to sign up using my email and password so I can create a new account.
- **US 1.2:** As an existing user, I want to sign in securely to access my dashboard.
- **US 1.3:** As an authenticated user, I want to log out to protect my session on shared devices.

### Epic 2: Expense & Income Tracking
As a user, I want to log and categorize my expenses and incomes so that I can monitor my cash flow.
- **US 2.1:** As a user, I want to add a new expense with details (name, price, date, category, payment method, notes) so I can track my spending.
- **US 2.2:** As a user, I want to add my income sources so I can see my total earnings.
- **US 2.3:** As a user, I want to view a list of all my expenses and incomes so I can review past transactions.
- **US 2.4:** As a user, I want to edit or delete existing entries to correct any mistakes.
- **US 2.5:** As a user, I want autocomplete suggestions when typing expense names to speed up data entry.

### Epic 3: Investments & Subscriptions
As a user, I want to track my investments and recurring subscriptions to have a holistic view of my finances.
- **US 3.1:** As a user, I want to log my investments (e.g., crypto, stocks) including units and price.
- **US 3.2:** As a user, I want to track recurring subscriptions (monthly/yearly) so I know upcoming fixed costs.
- **US 3.3:** As a user, I want to mark a subscription as active or cancelled.

### Epic 4: Dashboard & Analytics
As a user, I want to see a summarized view of my finances with visual charts to easily understand my financial health.
- **US 4.1:** As a user, I want to see summary cards of my total income, balance, expenses, investments, and subscriptions.
- **US 4.2:** As a user, I want to see bar charts for my expenses over time.
- **US 4.3:** As a user, I want to filter the dashboard data by date (This Month, Last Month, This Year, All Time).
- **US 4.4:** As a Premium user, I want to view advanced charts like "Recent Activities" and "Top Spent Categories".

---

## 14. User Journey

**Persona:** Andi, a freelancer who wants to manage his personal budget and track multiple income streams and subscriptions.

1. **Discovery & Onboarding:** Andi finds Dompetku and signs up with his email. He is immediately redirected to an empty but clean dashboard.
2. **Initial Setup (Income):** Andi logs his current month's freelance salary. The dashboard immediately reflects his current balance.
3. **Daily Usage (Expenses):** Throughout the week, Andi logs his daily expenses (food, transport). He uses the hotkey `n` to quickly open the 'Add Expense' modal. Autocomplete helps him add recurring items like "Coffee" faster.
4. **Subscription Management:** Andi realizes he has several streaming services. He navigates to the Subscriptions tab and adds Netflix and Spotify, setting their billing cycles.
5. **Review & Analytics:** At the end of the month, Andi reviews the Dashboard. He filters by "This Month" and looks at the charts to see which category consumed most of his budget.
6. **Upgrade to Premium:** Satisfied with the tool, but wanting to export his data to CSV for tax purposes, Andi upgrades to the Premium plan.

---

## 15. User Flow

### 15.1 Flow: Adding a New Financial Entry (Expense/Income)
1. User lands on the **Dashboard**.
2. User clicks the **"+" (Add Data) floating button** or presses the `n` hotkey.
3. A modal appears asking what type of data to add (Expense, Income, Investment, Subscription).
4. User selects **Expense**.
5. Form appears:
   - *If User types an existing name*, **Autocomplete dropdown** shows suggestions.
   - User fills in: Name, Price, Date, Category, Paid Via, Notes.
6. User clicks **Save**.
7. System validates input.
   - *If invalid*, shows inline errors.
   - *If valid*, POST request sent to API.
8. System updates the database and returns success.
9. Modal closes, UI displays a success toast, and the Dashboard data/charts update automatically (via SWR).

