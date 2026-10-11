import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

// The only user fields the API ever sends. No passwordHash, ever.
export function toProfile(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    upiId: user.upiId,
    role: user.role,
    balance: user.balance,
  };
}

function signToken(user) {
  // "sub" (subject) is the standard JWT field for "who this token is about".
  return jwt.sign({ sub: user._id.toString() }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

// "Priya.S+1@gmail.com" -> "priya.s1@sandbox", then "priya.s12@sandbox" if taken, and so on.
async function makeUpiId(email) {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9.]/g, '') || 'user';
  let upiId = `${base}@sandbox`;
  for (let n = 2; await User.exists({ upiId }); n++) {
    upiId = `${base}${n}@sandbox`;
  }
  return upiId;
}

export async function register(req, res) {
  const { name, email, password } = req.body;

  if (await User.exists({ email })) {
    throw new AppError('VALIDATION_ERROR', 400, 'This email is already registered');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    upiId: await makeUpiId(email),
  });

  res.status(201).json({ token: signToken(user), user: toProfile(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;

  // passwordHash is hidden by default (select: false), so ask for it explicitly here.
  const user = await User.findOne({ email }).select('+passwordHash');

  // Same message for "no such user" and "wrong password", so attackers can't
  // use the login form to find out which emails are registered.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('UNAUTHENTICATED', 401, 'Invalid email or password');
  }

  res.json({ token: signToken(user), user: toProfile(user) });
}

export async function me(req, res) {
  res.json({ user: toProfile(req.user) });
}
