import express, { Application } from 'express';
import cors from 'cors';
import apiRouter from '@/routes/index';
import { errorHandler } from '@/middlewares/errorHandler.middleware';

const app: Application = express();

// Global Middlewares
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Authorization', 'Content-Type'] }));
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

const requestCounts = new Map<string, { count: number; resetAt: number }>();
app.use((req, res, next) => {
  const now = Date.now();
  const key = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
  const current = requestCounts.get(key);
  const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : current;
  entry.count += 1;
  requestCounts.set(key, entry);
  if (entry.count > 120) return res.status(429).json({ success: false, error: 'Too many requests.' });
  next();
});

// Body Parser Middleware Wrapper
// Safely bypasses body-parser stream parsing when req.body is pre-parsed by Next.js App Router handler
const jsonParser = express.json({ limit: '6mb' });
const urlencodedParser = express.urlencoded({ extended: false, limit: '100kb' });

app.use((req, res, next) => {
  if (req.body !== undefined) {
    return next();
  }
  jsonParser(req, res, (err) => {
    if (err) return next();
    urlencodedParser(req, res, next);
  });
});

// Mount Central Backend API Routes under /api/v1 and /api
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;


