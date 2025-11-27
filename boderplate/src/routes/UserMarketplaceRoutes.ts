import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { UserMarketplaceController } from '../controllers/UserMarketplaceController';

const userMarketplaceRouter = Router();
const controller = new UserMarketplaceController();

userMarketplaceRouter.use(authMiddleware);

userMarketplaceRouter.post(
  '/',
  [body('nome').isString().notEmpty(), body('type').isIn(['ml', 'sh', 'tk'])],
  controller.create
);

userMarketplaceRouter.get('/', controller.findAll);

userMarketplaceRouter.get('/:id', [param('id').isUUID()], controller.findById);

userMarketplaceRouter.put(
  '/:id',
  [
    param('id').isUUID(),
    body('nome').optional().isString(),
    body('type').optional().isIn(['ml', 'sh', 'tk']),
    body('status').optional().isBoolean(),
  ],
  controller.update
);

userMarketplaceRouter.delete('/:id', [param('id').isUUID()], controller.delete);

export { userMarketplaceRouter };


