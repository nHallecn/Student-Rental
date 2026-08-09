import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { universityRouter } from './university.routes.js';

export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use(universityRouter);

