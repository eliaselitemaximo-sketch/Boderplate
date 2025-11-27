import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { adminRouter } from './routes/AdminRoutes';
import { userMarketplaceRouter } from './routes/UserMarketplaceRoutes';
import { authMarketplaceRouter } from './routes/AuthMarketplaceRoutes';
import { marketplaceRouter } from './routes/MarketplaceRoutes';
import { webhookRouter } from './routes/WebhookRoutes';
import logger from './infra/logs/logger';
import {
  getQueueService,
  getNotificationRecoveryService,
} from './services/mercadolivre/MercadoLivreFactory';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Marketplace Boilerplate API is running' });
});

app.use('/api/auth', adminRouter);
app.use('/api/marketplace/user', userMarketplaceRouter);
app.use('/api/marketplace/auth', authMarketplaceRouter);
app.use('/api/marketplace/webhook', webhookRouter);
app.use('/api/marketplace', marketplaceRouter);

const queueService = getQueueService();
const notificationRecoveryService = getNotificationRecoveryService();

async function verificacaoAutomaticaNotificacoes() {
  try {
    logger.info({
      context: 'index.verificacaoAutomaticaNotificacoes',
      message: 'Verificação automática de notificações perdidas iniciada',
    });

    const resultadoRecuperacao = await notificationRecoveryService.processarNotificacoesPerdidas();

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const resultadoReprocessamento = await notificationRecoveryService.reprocessarNotificacoesNaoProcessadas();

    logger.info({
      context: 'index.verificacaoAutomaticaNotificacoes',
      message: 'Verificação automática concluída',
      recuperacao: `${resultadoRecuperacao.processadas}/${resultadoRecuperacao.total}`,
      reprocessamento: `${resultadoReprocessamento.reprocessadas}/${resultadoReprocessamento.total}`,
    });
  } catch (error: any) {
    logger.error({
      context: 'index.verificacaoAutomaticaNotificacoes',
      message: `Erro na verificação automática: ${error.message}`,
      error: error.message,
    });
  }
}

const INTERVALO_VERIFICACAO = 30 * 60 * 1000;
setInterval(verificacaoAutomaticaNotificacoes, INTERVALO_VERIFICACAO);

setTimeout(() => {
  logger.info({
    context: 'index',
    message: 'Iniciando primeira verificação automática de notificações...',
  });
  verificacaoAutomaticaNotificacoes();
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  logger.info({
    context: 'index',
    message: `Server is running on port ${PORT}`,
    port: PORT,
    verificacaoAutomatica: 'A cada 30 minutos',
  });
  console.log(`Server is running on port ${PORT}`);
});