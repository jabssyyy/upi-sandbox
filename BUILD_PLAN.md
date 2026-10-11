# UPI Sandbox: build plan

Work in order. Do not start a phase until the previous one's "Done when" is true. Commit at the end of every phase. Read `context.md` first.

How to start each phase in Claude Code: say "Start phase N. Explain the plan in 3 to 5 lines first." When it finishes, run its check, answer its viva question out loud, and only then commit.

---

## Phase 0: setup
Goal: tools installed, repo ready, database reachable.
- [ ] Install Node 20 LTS+, Angular CLI (`npm i -g @angular/cli`), Git
- [ ] Create a MongoDB Atlas free cluster, a database user, and allow your IP. Copy the connection string
- [ ] Create `upi-sandbox/`, run `git init`, add `.gitignore` (node_modules, .env, dist)
- [ ] Put `context.md` and `BUILD_PLAN.md` in the root
- [ ] `ng new client --routing --style=scss`, and `mkdir server && cd server && npm init -y`

Done when: `ng serve` shows the default Angular page and the Atlas cluster is running.
Concept: client-side vs server-side, SPA.

---

## Phase 1: server skeleton
Goal: Express runs, connects to MongoDB, answers a health check.
- [ ] Playground first (not part of the app): `server/playground/http-server.js` using only Node's built-in `http.createServer` (handle `/` and `/time` by hand, set status and headers). Then `server/playground/callbacks.js` reading a file with `fs.readFile(path, callback)`, and the same task again with promises and `async/await`. This shows what Express and async/await later simplify
- [ ] Install `express mongoose dotenv cors morgan` and `nodemon` (dev). Set `"type": "module"` and add `dev` and `start` scripts
- [ ] `config/env.js`, `config/db.js`, `app.js`, `server.js`
- [ ] Middleware order: `morgan`, `cors`, `express.json()`, routes, `errorHandler`
- [ ] `GET /api/health` returns `{ ok: true }`
- [ ] `utils/AppError.js` and `middleware/errorHandler.js` with the shared error shape

Done when: `npm run dev` logs "MongoDB connected" and `/api/health` works in Postman. A thrown `AppError` returns the right JSON.
Concepts: raw Node server, callbacks vs async/await, modules, npm, Express app, middleware, async DB connection.
Viva: what is middleware and why does order matter? Why do callbacks get messy, and what replaced them?

---

## Phase 2: models and seed
Goal: the three collections exist with real data.
- [ ] `models/User.js`, `Transaction.js`, `Rule.js` exactly as in context.md section 7
- [ ] `utils/money.js` (rupees to paise and back) and `utils/dates.js` (start of today in IST)
- [ ] `seed/seed.js`: 1 admin, 4 demo users, the 3 default rules, 15 sample transactions. Hash passwords with `bcrypt`. Make it re-runnable (clear then insert)
- [ ] Add `npm run seed`

Done when: after seeding, Atlas shows the 3 collections with the expected documents.
Concepts: documents, collections, data types, CRUD (insert, delete), indexes.
Viva: why is `params` a free-form object in `rules`?

---

## Phase 3: auth
Goal: register, login, protected routes.
- [ ] Install `jsonwebtoken bcrypt express-validator`
- [ ] `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- [ ] `middleware/validate.js` (reads express-validator results into `VALIDATION_ERROR`)
- [ ] `middleware/authRequired.js` and `middleware/requireAdmin.js`
- [ ] Write `server/requests.http` covering register, login, me, and a call without a token

Done when: login returns a token, `/auth/me` works with it and returns 401 without it, a normal user gets 403 on an admin route.
Concepts: routing, custom middleware, REST, request and response handling.
Viva: what is in a JWT and why is it not encrypted?

---

## Phase 4: wallet, lookup, history
Goal: read-side endpoints with real queries.
- [ ] `GET /wallet` (balance plus today's spend using an aggregation or sum query)
- [ ] `POST /wallet/topup` (cap ₹50,000 per call)
- [ ] `GET /users/lookup?upiId=` (returns name only, never the balance)
- [ ] `GET /transfers` with filters `status`, `from`, `to`, and pagination
- [ ] Add every call to `requests.http`

Done when: filtering history by status and date range returns correct results against the seeded data.
Concepts: CRUD, querying and filtering (`$gte`, `$lte`), sort, skip, limit.
Viva: how does `$gte` / `$lte` filtering work on dates?

---

## Phase 5: fraud engine and transfers (the core)
Goal: a transfer passes through the rules and moves money safely.
- [ ] `events/appEvents.js` and `events/listeners.js` (console audit lines)
- [ ] `rules/dailyLimit.js`, `newPayeeCap.js`, `velocity.js`, and `rules/index.js` (loads enabled rules from the DB on every call)
- [ ] `middleware/fraudCheck.js`: on a hit, insert a `blocked` transaction, emit `transfer.blocked`, respond 403 `FRAUD_BLOCKED`
- [ ] `services/transferService.js`: `session.withTransaction` with a conditional debit (`balance: { $gte: amount }`), credit, insert `success`; emit `transfer.completed`
- [ ] Hard checks: not to self, receiver exists, amount is a positive integer, balance is sufficient
- [ ] `POST /transfers` wired as `authRequired`, `validate`, `fraudCheck`, handler
- [ ] Add a scenario for each rule to `requests.http`: normal transfer, new payee over cap, over daily limit, 4 quick transfers

Done when: all 3 rules block with clear messages, a normal transfer updates both balances, and the ledger shows both `success` and `blocked` rows. Forcing an error inside the transaction leaves both balances unchanged.
Concepts: middleware chain, async/await, EventEmitter, MongoDB queries, transactions.
Viva: what happens if the server crashes between debit and credit?

---

## Phase 6: admin endpoints
Goal: rules can be edited and the blocked log can be read.
- [ ] `GET /rules`, `PUT /rules/:key` (validate `params` shape per rule, set `updatedBy`, emit `rule.updated`)
- [ ] `GET /admin/blocked` (join sender and receiver names)
- [ ] `GET /admin/stats` (aggregation: blocked count per rule, volume per day for the last 7 days)

Done when: editing the new-payee cap through the API changes the next transfer's outcome with no restart.
Concepts: REST (PUT), aggregation pipeline, role-based middleware.
Viva: why does the engine read rules from the database on every transfer?

**Backend is now complete. Tag it: `git tag backend-done`.**

---

## Phase 7: Angular skeleton
Goal: app shell, routing, auth plumbing.
- [ ] Interfaces in `core/models`: `User`, `Transaction`, `Rule`, `ApiError`
- [ ] `core/models/money.ts`: a `Money` class (typed fields, a constructor, `static fromRupees()`, `toRupees()`, `format()`) plus a couple of typed helper functions, so TypeScript variables, types, functions and classes are all used
- [ ] `AuthService` (login, register, logout, current user, token in `localStorage`)
- [ ] Functional interceptors: add the JWT header, handle 401
- [ ] `authGuard`, `adminGuard`
- [ ] Route table from context.md section 12, a nav bar with the "Sandbox: fake money only" banner

Done when: visiting `/wallet` while logged out redirects to `/login`, and the token is attached to API calls.
Concepts: TypeScript interfaces, services, dependency injection, routing, guards.
Viva: how does Angular's dependency injection give the interceptor its dependencies?

---

## Phase 8: auth pages
Goal: login and register screens.
- [ ] Login and register as template-driven forms (`ngModel`, `#form="ngForm"`, validation messages)
- [ ] Show server errors (for example "email already used") from the shared error shape
- [ ] Redirect to `/wallet` after login

Done when: you can register, log out, log in, and bad input shows clear messages.
Concepts: template-driven forms, data binding, `*ngIf` / `@if`.
Viva: why template-driven here and reactive on the send page?

---

## Phase 9: wallet and history
Goal: read-only screens that look good.
- [ ] `WalletService` and the wallet page: balance card, today's spend, 5 recent transactions
- [ ] History page: table with status badges (`[ngClass]`), a status filter dropdown, a date range, pagination
- [ ] A small `StatusBadge` shared component with an `@Input`
- [ ] One custom attribute directive, `appHighlightBlocked`, that tints a blocked row (`@Directive`, `ElementRef`)

Done when: filters change the table by calling the API, and badges show green for success and red for blocked.
Concepts: components and templates, property and event binding, directives, `@Input`, services.
Viva: difference between property binding and event binding, with an example from your code.

---

## Phase 10: send money (the demo screen)
Goal: the transfer form that triggers the wow moment.
- [ ] Reactive form with `FormBuilder` and validators (required, min amount, max note length)
- [ ] UPI id field that calls the lookup endpoint (on blur) and shows the receiver's name
- [ ] Convert rupees to paise only when submitting
- [ ] On `FRAUD_BLOCKED`, show a clear red panel with the rule's message; on success, a green confirmation and the new balance

Done when: the demo steps 2 and 3 in context.md section 17 work end to end.
Concepts: reactive forms, validators, services, error handling with RxJS.
Viva: what does `FormBuilder` give you over writing `new FormControl()` yourself?

---

## Phase 11: admin screens
Goal: live rule editing and the blocked log.
- [ ] `/admin/rules`: one reactive form per rule (enabled toggle, params fields), save button, success message
- [ ] `/admin/blocked`: table of blocked attempts
- [ ] Simple stats using plain HTML and CSS bars (no chart library)

Done when: demo steps 4 and 5 work: raise the cap, retry, the transfer succeeds.
Concepts: reactive forms, route guards, data binding, services.
Viva: how is the admin route protected on both the client and the server?

---

## Phase 12: polish and demo
- [ ] Loading and empty states, friendly error messages, responsive layout check
- [ ] Re-seed, then rehearse the 3-minute demo twice
- [ ] `README.md`: what it is, the "fake money" notice, setup steps, architecture, screenshots
- [ ] Re-read context.md section 18 and answer each viva question out loud
- [ ] Take 5 screenshots for the report: wallet, send, blocked, admin rules, blocked log

Done when: a classmate can clone the repo, follow the README, and run it.

---

## Risk list

| Risk | Mitigation |
|---|---|
| Transactions fail on a local standalone MongoDB | Use Atlas from the start |
| Time runs out | Follow the cut order in context.md section 3 |
| Over-engineering the rule engine | Stay at 3 rules, 3 small files |
| "It's just CRUD" criticism | Demo the live rule edit, the blocked ledger and the stats aggregation |
| Viva questions on JWT, bcrypt, Mongoose | Not in syllabus: read one page on each by Phase 3 |
