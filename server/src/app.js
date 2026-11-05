import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { authRouter, authenticate } from './auth.js';
import { catalogRouter } from './catalog.js';
import { usersRouter } from './users.js';
import { rentalsRouter } from './rentals.js';
import { operationsRouter } from './operations.js';
import { deviceRouter, monitoringRouter } from './iot.js';
import { errorHandler, HttpError } from './errors.js';

export function createApp({ pool, config }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY_HOPS ?? 0);
  app.use(helmet());
  app.use(cors({ origin: config.WEB_ORIGIN, methods: ['GET','POST','PATCH','DELETE'] }));
  app.use(express.json({ limit: '64kb' }));
  app.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));
  app.get('/ready', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ data: { status: 'ready' } });
    } catch { res.status(503).json({ error: { code: 'DB_UNAVAILABLE', message: 'Database chưa sẵn sàng.' } }); }
  });
  app.use('/api', rateLimit({ windowMs: 60000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use('/api/auth', authRouter(pool));
  app.use('/api/iot', deviceRouter(pool));
  app.use('/api', authenticate(pool));
  app.use('/api/users', usersRouter(pool));
  app.use('/api', catalogRouter(pool));
  app.use('/api', rentalsRouter(pool));
  app.use('/api', operationsRouter(pool));
  app.use('/api', monitoringRouter(pool));
  app.use((req, res, next) => next(new HttpError(404, 'NOT_FOUND', 'Không tìm thấy API.')));
  app.use(errorHandler);
  return app;
}
