import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { MarketplaceController } from '../controllers/MarketplaceController';

const marketplaceRouter = Router();
const controller = new MarketplaceController();

marketplaceRouter.use(authMiddleware);

marketplaceRouter.get('/credentials', controller.getCredentials);
marketplaceRouter.get('/webhook-config', controller.getWebhookConfig);

export { marketplaceRouter };

