import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';
import { authMiddleware } from '../middleware/authMiddleware';

const webhookRouter = Router();
const controller = new WebhookController();

// Rota pública para receber webhooks (sem autenticação)
// Esta rota recebe webhooks dos marketplaces (Mercado Livre, Shopee, TikTok Shop)
// URLs configuradas no .env: WEBHOOK_URL_ML, WEBHOOK_URL_SH, WEBHOOK_URL_TK
webhookRouter.post('/', controller.handleWebhook);

// Rota protegida para listar todos os logs de webhooks (requer autenticação)
webhookRouter.get('/logs', authMiddleware, controller.getAllWebhookLogs);

export { webhookRouter };
