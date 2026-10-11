# UPI Sandbox

> **Sandbox: fake money only.** This is a learning project. It never touches real UPI, real banks or real money.

A simulated UPI payment app built on the MEAN stack (MongoDB, Express, Angular, Node). Users send virtual rupees to each other by UPI id. Every transfer passes through a **fraud rule engine** that runs as Express middleware. An admin can edit the rules live, and the very next transfer obeys the new rule, with no restart.

## Features

**Users**
- Register and log in (JWT); every new account starts with ₹1,00,000 of sandbox money
- Wallet with balance, today's spend, recent activity and a top-up
- Send money by UPI id, with a live receiver-name lookup and one-tap recent payees
- Clear green (sent) and red (blocked, with the reason) result panels
- Transaction history with status and date filters, pagination, receipts and CSV export
- Dark mode, toast notifications and skeleton loaders

**Fraud engine**
- `DAILY_LIMIT`: total successful spend per IST day
- `NEW_PAYEE_CAP`: a large first payment to someone new
- `VELOCITY`: too many transfers in a short window
- Blocked attempts are written to an append-only ledger

**Admins**
- Edit each rule's settings or switch it off; changes apply to the next transfer
- Rule simulator: dry-run any transfer and see which rule would fire, without moving money
- Blocked-attempts log and stats (blocks per rule, money moved per day) from MongoDB aggregations

## Tech stack

| Layer | Choice |
|---|---|
| Client | Angular 21 (standalone components, signals, zoneless), TypeScript strict, plain SCSS |
| Server | Node.js 20+, Express 5, ES modules |
| Database | MongoDB Atlas (replica set, needed for transactions) via Mongoose |
| Auth | JSON Web Tokens, bcrypt password hashing |

## Architecture

```
Angular SPA ──(REST + JSON, Authorization: Bearer <jwt>)──► Express API ──(Mongoose)──► MongoDB Atlas
                                                                                         users | transactions | rules
POST /api/transfers pipeline:
  authRequired → validate → fraudCheck → handler (MongoDB transaction: debit, credit, ledger row)
                               │                                 │
                               └─ blocked: ledger row + 403      └─ event: transfer.completed
```

- Money is stored as **integer paise** (₹1 = 100) to avoid floating-point errors.
- The debit is conditional (`balance >= amount`) and runs inside a **MongoDB transaction** with the credit, so money can never be lost or double-spent.
- Rules are read from MongoDB on **every** transfer, which is why admin edits apply instantly.

## Getting started

### 1. Prerequisites
- Node.js 20 or newer, and npm
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (a plain local `mongod` does **not** support transactions)

### 2. Server
```bash
cd server
npm install
cp .env.example .env      # then edit .env (see below)
npm run seed              # demo users, rules and sample transactions (safe to re-run)
npm run dev               # API on http://localhost:3000
```

`server/.env`:
```
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/upi_sandbox?retryWrites=true&w=majority
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=2h
CLIENT_ORIGIN=http://localhost:4200
```

### 3. Client
```bash
cd client
npm install
npm start                 # http://localhost:4200
```

### Demo accounts
All seeded accounts use the password `Password@123`.

| Email | Role | Notes |
|---|---|---|
| admin@sandbox.dev | admin | edits rules, sees the blocked log |
| priya@sandbox.dev | user | has paid Ravi before, never Karan |
| ravi@sandbox.dev | user | |
| anita@sandbox.dev | user | |
| karan@sandbox.dev | user | |

## Demo script (about 3 minutes)
1. Log in as Priya. The wallet shows her balance.
2. Send ₹2,000 to `ravi@sandbox`. It succeeds.
3. Send ₹25,000 to `karan@sandbox`. It is **blocked**: "New payee limit is ₹10,000".
4. Log in as admin and open **Rules**. Raise the new-payee cap to ₹30,000 and save. (Optional: run the simulator before and after.)
5. As Priya, retry the same transfer. It **succeeds**, with no restart.
6. Show the admin **Blocked log** and stats, then send 4 quick transfers to trigger the velocity rule.

## API overview
All routes are under `/api` and return JSON. Errors always use `{ "error": { "code", "message", "rule?" } }`.

| Method and path | Auth | Purpose |
|---|---|---|
| POST `/auth/register`, `/auth/login` | none | create account / log in, returns a token |
| GET `/auth/me` | user | current profile |
| GET `/wallet`, POST `/wallet/topup` | user | balance and today's spend; add sandbox money |
| GET `/users/lookup?upiId=` | user | receiver's name |
| POST `/transfers`, GET `/transfers` | user | send money; filtered, paginated history |
| GET `/rules`, PUT `/rules/:key`, POST `/rules/simulate` | admin | list, edit, dry-run rules |
| GET `/admin/blocked`, GET `/admin/stats` | admin | blocked log; aggregated stats |

Every endpoint has a ready-made example in [`server/requests.http`](server/requests.http) (VS Code REST Client).

## Project structure
```
server/src/
  app.js, server.js        Express app and startup
  config/                  env and database connection
  models/                  User, Transaction (ledger), Rule
  routes/, controllers/    REST endpoints
  middleware/              authRequired, requireAdmin, validate, fraudCheck, errorHandler
  rules/                   the fraud engine: one file per rule + index.js
  services/                transferService (the MongoDB transaction)
  events/                  EventEmitter audit log
  seed/                    demo data
server/playground/         raw Node http server and callbacks demo (learning only)
client/src/app/
  core/                    models, services, interceptors, guards
  features/                auth, wallet, send, history, admin pages
  shared/                  nav bar, status badge, receipt, toasts, highlight directive
```
