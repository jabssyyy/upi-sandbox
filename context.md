# UPI Sandbox: project context

Read this file at the start of every session. It is the single source of truth for scope, design and conventions. If something here conflicts with a suggestion, flag it and ask before changing it.

## 1. What this is

A mini project for a MEAN-stack course (Angular, Node, Express, MongoDB). UPI Sandbox is a simulated payment app with fake money. Users send virtual rupees to each other. Every transfer passes through a fraud rule engine built as Express middleware. An admin edits the rules live, and the next transfer obeys them with no restart.

This is a simulator. It never touches real UPI, real banks or real money. The UI and README must say "Sandbox: fake money only".

## 2. Success criteria

1. Every unit of the syllabus is visibly used (see section 14).
2. One wow demo: a risky transfer is blocked with a clear reason, the admin changes a rule, and the same transfer then succeeds (section 17).
3. The owner can explain every file in a viva. If code is too clever to explain, simplify it.
4. A small finished project beats a big broken one.

## 3. Scope

In scope:
- Register and login with JWT
- Wallet with a sandbox balance
- Send money by UPI id
- Transaction history with filters
- Fraud rule engine with 3 configurable rules
- Admin screens: edit rules, view the blocked log, see simple stats

Out of scope (do not add, even if it seems nice):
- Real payments, real bank or UPI APIs, KYC, OTP, email or SMS
- Socket.io or any real-time layer, maps, AI or ML features
- Microservices, Docker, CI/CD, mobile apps, a UI component library

Cut order if time runs short: stats chart first, then the history date filter, then the velocity rule. The core (auth, transfer, 2 rules, admin rule edit) never gets cut.

## 4. Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 LTS or newer, plain JavaScript with ES modules (`"type": "module"`) |
| Server | Express (npm default version). On v4, wrap async handlers with a small `asyncHandler` helper. On v5, async errors reach the error handler on their own. |
| Database | MongoDB Atlas free tier (a replica set, which transactions require) |
| ODM | Mongoose |
| Server packages | `express`, `mongoose`, `jsonwebtoken`, `bcrypt`, `morgan`, `cors`, `dotenv`, `express-validator` |
| Client | Angular (latest CLI), standalone components, TypeScript strict mode, plain SCSS, no UI library |
| Dev tools | Git, Postman or the VS Code REST Client (`server/requests.http`), `nodemon` |

Local standalone `mongod` does NOT support transactions. Always develop against Atlas.

## 5. Architecture

```
Angular SPA (browser)
  Components -> Services (HttpClient) -> JWT interceptor
        |  REST + JSON over HTTP, Authorization: Bearer <token>
        v
Express server (Node)
  morgan -> cors/json -> authRequired -> validate -> fraudCheck -> handler
                                             |            |
                                             |            +-> emits events (EventEmitter)
        |  Mongoose
        v
MongoDB Atlas: users | transactions | rules
```

Request flow for `POST /api/transfers`:
1. `authRequired` verifies the JWT and sets `req.user`.
2. `validate` checks the body (express-validator).
3. `fraudCheck` loads the sender and receiver, builds a context, and runs the enabled rules. On a hit it logs a `blocked` transaction, emits `transfer.blocked`, and responds 403 `FRAUD_BLOCKED`.
4. The handler calls `transferService.execute()`, which runs a MongoDB transaction: conditional debit, credit, insert a `success` transaction. It then emits `transfer.completed`.

## 6. Money rules

- All amounts are stored and sent as integers in paise (₹1 = 100). Never use floats for money.
- The API speaks paise only. Angular converts rupees to paise at the form boundary and back for display (use the built-in `CurrencyPipe` with `amount / 100`).
- New users start with a sandbox balance of ₹1,00,000 (10,000,000 paise).
- "Today" means the start of the day in IST (Asia/Kolkata).

## 7. Data models

### users
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique, lowercase |
| passwordHash | String | bcrypt, never returned by the API |
| upiId | String | unique, format `name@sandbox`, generated at register from the email prefix |
| role | String | `user` or `admin`, default `user` |
| balance | Number | paise, integer, default 10000000 |
| createdAt | Date | timestamps |

### transactions (the ledger, append only: never update or delete)
| Field | Type | Notes |
|---|---|---|
| from | ObjectId (users) | sender |
| to | ObjectId (users) | receiver |
| amount | Number | paise, integer, greater than 0 |
| status | String | `success` or `blocked` |
| ruleHit | Object or null | `{ key, reason }` when blocked |
| note | String | optional, max 60 chars |
| createdAt | Date | indexed |

Index: `{ from: 1, createdAt: -1 }`.

### rules (the flexible part, and the answer to "why MongoDB?")
| Field | Type | Notes |
|---|---|---|
| key | String | unique: `DAILY_LIMIT`, `NEW_PAYEE_CAP`, `VELOCITY` |
| name | String | display name |
| enabled | Boolean | admin can toggle |
| params | Object | different shape per rule |
| updatedBy | ObjectId | admin who last edited |
| updatedAt | Date | timestamps |

Default rule documents:
```json
{ "key": "DAILY_LIMIT",   "enabled": true, "params": { "maxAmount": 5000000 } }
{ "key": "NEW_PAYEE_CAP", "enabled": true, "params": { "maxAmount": 1000000 } }
{ "key": "VELOCITY",      "enabled": true, "params": { "maxCount": 3, "windowSeconds": 60 } }
```

Two checks are hard validations, not editable rules: no transfer to yourself, and no transfer above the balance.

## 8. Fraud rule engine

Each rule is one file in `server/src/rules/` exporting:
```js
export default {
  key: 'NEW_PAYEE_CAP',
  async evaluate(ctx, params) {
    // return null if the transfer is fine, or { reason: '...' } if it should be blocked
  },
};
```

`ctx` holds `{ sender, receiver, amount, now }` plus helper queries (for example `ctx.sumSpentSince(date)`, `ctx.hasPaidBefore()`, `ctx.countRecent(seconds)`), all built on Mongoose queries.

Rule logic:
- `DAILY_LIMIT`: successful spend by the sender since the start of today (IST) plus this amount is greater than `params.maxAmount`.
- `NEW_PAYEE_CAP`: the sender has no earlier `success` transaction to this receiver and the amount is greater than `params.maxAmount`.
- `VELOCITY`: the sender has `params.maxCount` or more `success` transactions in the last `params.windowSeconds`.

`rules/index.js` loads the enabled rule documents on every transfer (no caching, so admin edits apply immediately), matches each to its module by `key`, and returns the first hit in the order above.

## 9. API contract

All routes are under `/api`. JSON in and out. Auth means `Authorization: Bearer <jwt>`.

| Method and path | Auth | Purpose |
|---|---|---|
| POST `/auth/register` | none | create user, return token and profile |
| POST `/auth/login` | none | return token and profile |
| GET `/auth/me` | user | current profile |
| GET `/wallet` | user | balance and today's spend |
| POST `/wallet/topup` | user | add fake money, body `{ amount }` in paise, max ₹50,000 per call |
| GET `/users/lookup?upiId=` | user | find a receiver's name by UPI id |
| POST `/transfers` | user | body `{ toUpiId, amount, note? }` |
| GET `/transfers` | user | own history. Query: `status`, `from`, `to` (dates), `page`, `limit` |
| GET `/rules` | admin | list rules |
| PUT `/rules/:key` | admin | update `enabled` and `params` |
| GET `/admin/blocked` | admin | blocked transactions, newest first |
| GET `/admin/stats` | admin | aggregation: blocked count per rule, transfer volume per day |

Error shape for every failure:
```json
{ "error": { "code": "FRAUD_BLOCKED", "rule": "NEW_PAYEE_CAP", "message": "New payee limit is ₹10,000" } }
```
Codes: `VALIDATION_ERROR` (400), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `FRAUD_BLOCKED` (403), `INSUFFICIENT_BALANCE` (400), `NOT_FOUND` (404), `SERVER_ERROR` (500).

## 10. Events (Node EventEmitter)

`server/src/events/appEvents.js` exports one shared emitter. Events: `transfer.completed`, `transfer.blocked`, `rule.updated`. A listener module logs each to the console as an audit line. Keep listeners tiny: this exists to show the Node events concept, not to build a bus.

## 11. Folder structure

```
upi-sandbox/
  context.md  BUILD_PLAN.md  README.md  .gitignore
  server/
    package.json  .env  .env.example  requests.http
    src/
      server.js            start: connect DB, listen
      app.js               express app, middleware, routes
      config/              env.js, db.js
      models/              User.js, Transaction.js, Rule.js
      routes/              auth.js, wallet.js, users.js, transfers.js, rules.js, admin.js
      controllers/         one per route file
      middleware/          authRequired.js, requireAdmin.js, validate.js, fraudCheck.js, errorHandler.js
      rules/               index.js, dailyLimit.js, newPayeeCap.js, velocity.js
      services/            transferService.js
      events/              appEvents.js, listeners.js
      utils/               money.js, dates.js, AppError.js
      seed/                seed.js
    playground/            http-server.js, callbacks.js (learning only, not imported by the app)
  client/                  (ng new client --routing --style=scss)
    src/app/
      core/                services/, guards/, interceptors/, models/
      features/            auth/, wallet/, send/, history/, admin/
      shared/              small reusable components
```

## 12. Angular routes and guards

| Path | Guard | Component |
|---|---|---|
| `/login`, `/register` | none | auth pages (template-driven forms) |
| `/wallet` | `authGuard` | balance and recent activity |
| `/send` | `authGuard` | transfer form (reactive form) |
| `/history` | `authGuard` | filtered history |
| `/admin/rules` | `adminGuard` | edit rules |
| `/admin/blocked` | `adminGuard` | blocked log and stats |
| `''` | none | redirect to `/wallet` |
| `**` | none | not-found page |

A functional HTTP interceptor adds the JWT header. Another handles 401 by clearing the token and redirecting to `/login`.

## 13. Environment variables (`server/.env`)

```
PORT=3000
MONGODB_URI=<atlas connection string>
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=2h
CLIENT_ORIGIN=http://localhost:4200
```
Never commit `.env`. Commit `.env.example` with placeholder values.

## 14. Syllabus coverage map

| Syllabus unit | Where it appears |
|---|---|
| Web app basics, SPA, TypeScript | Angular SPA, interfaces `User`, `Transaction`, `Rule`, `ApiError`, a `Money` helper class |
| Angular components, templates, data binding, directives | wallet dashboard, history table with `*ngFor` / `@for`, status badges with `[ngClass]`, a custom `appHighlightBlocked` attribute directive |
| Angular services and DI | `AuthService`, `WalletService`, `TransferService`, `RuleService` |
| Angular forms | template-driven: login and register. Reactive with validators: send money. Reactive: admin rule editor. |
| Routing and navigation | route table above, guards, redirects |
| Node intro, NPM, modules, events, async | ES modules, npm packages, `EventEmitter`, raw `http.createServer` and callbacks in `playground/`, then async/await in the app |
| Express: apps, routing, middleware, REST | the full pipeline in section 5, custom middleware, REST routes in section 9 |
| MongoDB: documents, collections, CRUD, querying | three collections, flexible `params`, filters with `$gte` / `$lte`, aggregation for stats |

## 15. Conventions

- Plain JavaScript on the server and strict TypeScript on the client. No `any` in the client without a comment.
- Controllers stay thin: validate, call a service or model, respond. Business logic lives in services and rule files.
- Always `async/await` with `try/catch` or the `asyncHandler` helper. No callback pyramids.
- One `AppError(code, status, message)` class, thrown anywhere, formatted by `errorHandler.js`.
- Never return `passwordHash`. Never log tokens or passwords.
- Comment the why, not the what. Short comments only.
- Commit after each phase with a message like `phase 5: fraud engine and transfers`.

## 16. How to work with me

The owner is a B.Tech AI and Data Science student at an intermediate level who is learning fast. Treat this as a learning project as much as a build.
- Plan before code. At the start of each phase, state in 3 to 5 lines what we are building and why, then wait for a go-ahead.
- Explain the why, not just the how. After writing code, point out the 2 or 3 lines that matter most.
- Be brutally honest. If my idea is weak, off-track or over-scoped, say so directly and explain why. Do not just agree.
- Keep answers short, and give full files ready to paste rather than diffs when creating a file.
- Do not add features, packages or abstractions that are not in this document without asking first.
- After each phase, give a 3-line "check yourself" list so I can verify it works and name one viva question I should be able to answer.

## 17. Demo script (about 3 minutes)

1. Log in as a normal user. The wallet shows ₹1,00,000.
2. Send ₹2,000 to an existing friend. It succeeds and the balance updates.
3. Send ₹25,000 to a new payee. It is blocked with "New payee limit is ₹10,000". (Keep the amount small enough that today's total stays under the ₹50,000 daily limit, or `DAILY_LIMIT` blocks it first.)
4. Switch to the admin account and open the rules page. Raise the new-payee cap to ₹30,000 and save.
5. Back as the user, retry the same transfer. It succeeds. No restart, the rule lived in MongoDB.
6. Show the admin blocked log and the stats, then show a rapid-fire velocity block.

## 18. Viva prep

- Why MongoDB and not SQL? (Rule `params` differ per rule, so a flexible document fits better than columns.)
- Why paise integers instead of decimals? (Floating point errors in money.)
- What happens if the server crashes between debit and credit? (The MongoDB transaction rolls both back.)
- Where does the fraud check run, and why as middleware? (Between validation and the handler, so rules guard every transfer without touching the handler.)
- Template-driven vs reactive forms: why did you use each?
- What does the JWT interceptor do, and how does DI make it work?
- How do admin rule edits take effect without a restart? (Rules are read from the database on every transfer.)
