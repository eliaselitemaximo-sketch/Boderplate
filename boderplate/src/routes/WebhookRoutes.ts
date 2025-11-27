import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';

const webhookRouter = Router();
const controller = new WebhookController();

webhookRouter.post('/', controller.handleWebhook);
webhookRouter.post('/webhook', controller.handleWebhook);

webhookRouter.get('/health', controller.health);
webhookRouter.get('/status', controller.status);

webhookRouter.post('/processar-ordem/:orderId', controller.processarOrdem);
webhookRouter.post('/processar-pacote/:packId', controller.processarPacote);
webhookRouter.post('/limpar-fila', controller.limparFila);
webhookRouter.post('/recuperar-notificacoes', controller.recuperarNotificacoes);
webhookRouter.post('/reprocessar-notificacoes', controller.reprocessarNotificacoes);
webhookRouter.get('/historico-notificacoes', controller.historicoNotificacoes);
webhookRouter.get('/estatisticas-notificacoes', controller.estatisticasNotificacoes);
webhookRouter.get('/logs', controller.getAllWebhookLogs);

export { webhookRouter };
