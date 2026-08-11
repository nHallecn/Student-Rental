import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { universityRouter } from './university.routes.js';
import { marketplaceRouter } from './marketplace.routes.js';
import { adminMarketplaceRouter } from './admin-marketplace.routes.js';

export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use(universityRouter);
apiRouter.use(marketplaceRouter);
apiRouter.use(adminMarketplaceRouter);
