// Fills the database with demo data. Safe to re-run: it clears everything first.
// Run with: npm run seed
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Rule } from '../models/Rule.js';
import { rupeesToPaise, formatPaise } from '../utils/money.js';
import { daysAgoIST } from '../utils/dates.js';

const DEMO_PASSWORD = 'Password@123';
const STARTING_BALANCE = 10000000; // ₹1,00,000 in paise

const RULES = [
  { key: 'DAILY_LIMIT', name: 'Daily limit', enabled: true, params: { maxAmount: 5000000 } },
  { key: 'NEW_PAYEE_CAP', name: 'New payee cap', enabled: true, params: { maxAmount: 1000000 } },
  { key: 'VELOCITY', name: 'Velocity', enabled: true, params: { maxCount: 3, windowSeconds: 60 } },
];

const USERS = [
  { name: 'Admin', email: 'admin@sandbox.dev', upiId: 'admin@sandbox', role: 'admin' },
  { name: 'Priya Sharma', email: 'priya@sandbox.dev', upiId: 'priya@sandbox' },
  { name: 'Ravi Kumar', email: 'ravi@sandbox.dev', upiId: 'ravi@sandbox' },
  { name: 'Anita Desai', email: 'anita@sandbox.dev', upiId: 'anita@sandbox' },
  { name: 'Karan Mehta', email: 'karan@sandbox.dev', upiId: 'karan@sandbox' },
];

// [from, to, rupees, daysAgo, timeIST, status, ruleHit?, note?]
// Shaped for the demo: Priya has paid Ravi before (an "old friend"), has NEVER paid
// Karan (a "new payee"), and has nothing dated today, so her daily limit is untouched.
// Each blocked row really would break its rule given the rows before it.
const TRANSACTIONS = [
  ['priya', 'ravi', 1500, 6, '10:00:00', 'success', null, 'Lunch'],
  ['ravi', 'priya', 800, 6, '18:00:00', 'success', null, 'Cab share'],
  ['anita', 'priya', 2500, 5, '11:00:00', 'success', null, 'Concert ticket'],
  ['karan', 'priya', 15000, 5, '15:00:00', 'blocked', { key: 'NEW_PAYEE_CAP', reason: 'New payee limit is ₹10,000' }],
  ['priya', 'anita', 1200, 5, '20:00:00', 'success', null, 'Groceries'],
  ['karan', 'ravi', 3000, 4, '09:00:00', 'success', null, 'Rent split'],
  ['priya', 'ravi', 450, 3, '12:00:00', 'success', null, 'Snacks'],
  ['anita', 'karan', 5000, 3, '14:00:00', 'success', null, 'Laptop repair'],
  ['anita', 'ravi', 48000, 3, '16:00:00', 'blocked', { key: 'DAILY_LIMIT', reason: 'Daily limit is ₹50,000' }],
  ['karan', 'anita', 1800, 2, '10:00:00', 'success', null, 'Books'],
  // Ravi's burst: 3 transfers inside one minute, so the 4th is blocked.
  ['ravi', 'karan', 900, 2, '17:00:00', 'success', null, 'Movie'],
  ['ravi', 'anita', 250, 2, '17:00:20', 'success', null, 'Popcorn'],
  ['ravi', 'priya', 400, 2, '17:00:40', 'success', null, 'Parking'],
  ['ravi', 'anita', 300, 2, '17:00:50', 'blocked', { key: 'VELOCITY', reason: 'Max 3 transfers in 60 seconds' }],
  ['priya', 'anita', 2200, 1, '19:00:00', 'success', null, 'Dinner'],
];

// '17:00:20' -> milliseconds after midnight
function timeToMs(time) {
  const [h, m, s] = time.split(':').map(Number);
  return ((h * 60 + m) * 60 + s) * 1000;
}

async function seed() {
  await connectDB();

  // 1. Clear old data so the script can run again and again.
  await Promise.all([User.deleteMany({}), Transaction.deleteMany({}), Rule.deleteMany({})]);
  // Make sure the indexes in the schemas (unique email, ledger index) exist in Atlas.
  await Promise.all([User.syncIndexes(), Transaction.syncIndexes(), Rule.syncIndexes()]);

  // 2. Rules
  await Rule.insertMany(RULES);

  // 3. Users. Hash once and reuse: every demo user shares the same password.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const balances = Object.fromEntries(USERS.map((u) => [u.upiId.split('@')[0], STARTING_BALANCE]));

  // 4. Replay the successful transactions on the balances, so the ledger and the
  //    balances agree, exactly as if these transfers had really happened.
  for (const [from, to, rupees, , , status] of TRANSACTIONS) {
    if (status !== 'success') continue; // blocked attempts never move money
    balances[from] -= rupeesToPaise(rupees);
    balances[to] += rupeesToPaise(rupees);
  }

  const users = await User.insertMany(
    USERS.map((u) => ({ ...u, passwordHash, balance: balances[u.upiId.split('@')[0]] })),
  );
  const idOf = Object.fromEntries(users.map((u) => [u.upiId.split('@')[0], u._id]));

  // 5. Transactions, back-dated over the last 7 days (helps the stats chart later).
  await Transaction.insertMany(
    TRANSACTIONS.map(([from, to, rupees, daysAgo, timeIST, status, ruleHit, note]) => ({
      from: idOf[from],
      to: idOf[to],
      amount: rupeesToPaise(rupees),
      status,
      ruleHit,
      note,
      createdAt: new Date(daysAgoIST(daysAgo).getTime() + timeToMs(timeIST)),
    })),
  );

  // 6. Summary
  console.log(`Seeded ${RULES.length} rules, ${users.length} users, ${TRANSACTIONS.length} transactions.`);
  console.log(`All passwords: ${DEMO_PASSWORD}`);
  console.table(users.map((u) => ({ email: u.email, upiId: u.upiId, role: u.role, balance: formatPaise(u.balance) })));
}

try {
  await seed();
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
