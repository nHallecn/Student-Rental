import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { errorHandler, notFound } from './lib/errors.js';
import { apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(pinoHttp({
    genReqId(request, response) {
      const existing = request.headers['x-request-id'];
      const id = typeof existing === 'string' ? existing : randomUUID();
      response.setHeader('x-request-id', id);
      return id;
    },
  }));

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok', service: 'student-rental-api', mode: env.DEMO_MODE ? 'demo' : 'postgres' });
  });
  app.get('/api/v1', (_request, response) => {
    response.json({ name: 'Student Rental Finder API', version: 'v1', documentation: '/api/v1/docs' });
  });
  app.use('/api/v1', apiRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
