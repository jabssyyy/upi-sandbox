import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { AppError } from './utils/AppError.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import ruleRoutes from './routes/rules.js';
import walletRoutes from './routes/wallet.js';
import userRoutes from './routes/users.js';
import transferRoutes from './routes/transfers.js';

export const app = express();

// Order matters: every request flows through these top to bottom.
app.use(morgan('dev')); // 1. log method, path, status, time
app.use(cors({ origin: env.clientOrigin })); // 2. let the Angular dev server call us
app.use(express.json()); // 3. turn a JSON body into req.body

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Each router handles every path under its prefix, e.g. /api/auth/login.
app.use('/api/auth', authRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transfers', transferRoutes);

// No route matched: hand a NOT_FOUND error to the error handler.
app.use((req, res, next) => {
  next(new AppError('NOT_FOUND', 404, `No route for ${req.method} ${req.path}`));
});

// Must be last, so errors from everything above end up here.
app.use(errorHandler);
