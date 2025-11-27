import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthMarketplaceController } from '../controllers/AuthMarketplaceController';

const authMarketplaceRouter = Router();
const controller = new AuthMarketplaceController();

authMarketplaceRouter.get(
  '/:id',
  authMiddleware,
  [param('id').isUUID()],
  controller.createAuthorizationURL
);

authMarketplaceRouter.get('/mercadolivre/code', controller.mercadoLivreCallback);

authMarketplaceRouter.get('/shopee/code', controller.shopeeCallback);

authMarketplaceRouter.get('/tiktokshop/code', controller.tiktokshopCallback);

authMarketplaceRouter.post(
  '/refresh-token',
  authMiddleware,
  [body('userMarketplaceId').isUUID()],
  controller.refreshToken
);

export { authMarketplaceRouter };

