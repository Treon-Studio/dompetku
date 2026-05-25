# expense.fyi — Product Requirements Document

## 1. Overview

**expense.fyi** is an open-source personal finance management application that allows users to track and manage incomes, investments, subscriptions, and expenses in one place. It provides data-driven insights, real-time visibility into spending habits, and helps identify overspending.

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