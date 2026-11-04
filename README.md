# MatrixSplit ⚡

> **Production-Quality Shared Expense Management Mobile Application & Backend**, inspired by Splitwise and modern fintech platforms (Revolut, Monzo).

MatrixSplit simplifies expense sharing, debt management, and real-time settlements across friends, roommates, couples, families, and group trips.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile App** | React Native, Expo (SDK 51), TypeScript, Expo Router (file-based navigation) |
| **Design System** | **Watermelon UI** (`@matrixsplit/watermelon-ui`), Emerald Green (`#10B981`), Deep Navy (`#0F172A`) |
| **State Management** | **Zustand** (client state) & **TanStack Query** (server caching & optimistic updates) |
| **Backend API** | Node.js, **NestJS** (Modular architecture, Guards, Decorators, WebSockets) |
| **Database & ORM** | **PostgreSQL** + **Drizzle ORM** (Atomic transactions, relational queries, strict schema) |
| **Embedded DB Engine** | **PGlite** (PostgreSQL WASM engine for zero-config local run) & standard PostgreSQL pool |
| **Authentication** | JWT with **Refresh Token Rotation**, bcrypt password hashing, 6-digit OTP verification |
| **Real-Time Engine** | **Socket.IO** (instant updates on expenses, debts, settlements, activities) |
| **Validation** | **Zod** (runtime validation shared across frontend and backend) |

---

## 📐 Architecture & Monorepo Structure

```
MatrixSplit/
├── packages/
│   ├── shared/                # Core financial math, split algorithms, debt simplification, Zod schemas, types
│   │   ├── src/types/         # User, Group, Expense, Settlement, Balance, Activity, Analytics
│   │   ├── src/schemas/       # Zod schemas (Signup, Expense, Split, Group, Settle)
│   │   ├── src/math/          # Integer minor-unit math (cents/paise) & split engines
│   │   └── src/algorithms/    # Debt simplification graph min-cash-flow algorithm
│   │
│   └── watermelon-ui/         # The Watermelon UI Component Kit
│       ├── src/theme/         # Color tokens, typography, radii, dark/light mode
│       └── src/components/    # Button, Card, Input, Avatar, Badge, BottomSheet, Skeleton, BalancePill
│
├── apps/
│   ├── backend/               # NestJS + Drizzle ORM + PostgreSQL
│   │   ├── src/database/      # Drizzle schema (13 normalized tables) & database module
│   │   ├── src/gateway/       # Socket.IO gateway for real-time events
│   │   ├── src/modules/       # Auth, Users, Friends, Groups, Expenses, Settlements, Balances, Activities, Analytics, Uploads
│   │   └── test/              # End-to-end financial transaction integration tests
│   │
│   └── mobile/                # React Native + Expo App
│       ├── app/               # Expo Router routes ((auth), (tabs), group/[id], expense/add, settle)
│       └── src/               # Zustand stores, TanStack Query hooks, API services, Socket client
```

---

## 🧮 Financial Calculation Engine & Split Algorithms

To guarantee mathematical correctness and eliminate floating-point rounding errors (`0.1 + 0.2 !== 0.3`), all financial records are stored and calculated in **integer minor currency units** (cents/paise):

1. **Equal Split**:
   $$\text{BaseShare} = \lfloor \text{Total} / N \rfloor, \quad \text{Remainder} = \text{Total} - (\text{BaseShare} \times N)$$
   Distributes remaining minor units deterministically so $\sum \text{Allocations} \equiv \text{Total}$.
2. **Exact Amount Split**:
   Validates that the sum of exact participant allocations strictly matches the total amount.
3. **Percentage Split**:
   Calculates fractional shares from user percentages and assigns rounding residuals to the highest fraction holders.
4. **Share-based Split**:
   Proportionally allocates amounts based on arbitrary share weights ($1x, 2x, 3x$) with residual preservation.

---

## 🌐 Debt Simplification Algorithm (Min-Cash-Flow)

Instead of requiring $N(N-1)/2$ multiple pairwise debts across a group:
- A owes B ₹500
- B owes C ₹500

MatrixSplit calculates every user's **Net Position**:
$$\text{Net}(u) = \text{Total Credited} - \text{Total Debited}$$

Then applies greedy bipartite matching between maximal debtors and maximal creditors, reducing the network to at most $N-1$ optimal transactions (e.g. **A directly pays C ₹500**).

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v20+ or v22 LTS)
- npm or pnpm

### 1. Run Unit & Financial Math Tests
```bash
cd packages/shared
npm test
```

### 2. Run Backend Integration Tests
```bash
cd apps/backend
npx ts-node test/integration.test.ts
```

### 3. Start Backend Server
```bash
cd apps/backend
npm run start:dev
# Running on http://localhost:3001/api/v1
```

### 4. Start Mobile Application
```bash
cd apps/mobile
npx expo start
```
- Press `w` to open in Web Browser
- Press `a` to run on Android Emulator
- Scan QR code with Expo Go app on iOS/Android device

---

## 🔒 Security & Data Integrity

- **Expense Ledger as Source of Truth**: Balances are calculated dynamically from ledger entries, preventing balance drift or desynchronization.
- **Atomic Database Transactions**: Expense creation, participant insertion, and settlements run in ACID transactions.
- **Soft Deletion & Audit Trail**: Deleting or modifying expenses preserves historical records and creates timeline activity logs.
- **JWT Refresh Token Rotation**: Mitigates token replay attacks with automatic token renewal.
