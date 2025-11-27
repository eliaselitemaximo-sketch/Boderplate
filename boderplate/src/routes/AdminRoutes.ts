import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';

const adminRouter = Router();
const controller = new AdminController();

adminRouter.post('/login', controller.login);
adminRouter.post('/verify', controller.verify);

export { adminRouter };

