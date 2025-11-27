import { ApiMlbService } from './mlb_api/ApiMlbService';
import { TokenMlbService } from './mlb_api/TokenMlbService';
import { WebhookNotificationRepository } from '../../repositories/mercadolivre/WebhookNotificationRepository';
import { WebhookNotification } from '../../entities/WebhookNotification';
import { QueueService } from './QueueService';
import logger from '../../utils/logger';
import { MercadoLivre } from '../../entities/MercadoLivre';

export class NotificationRecoveryService {
  private notificationRepository: WebhookNotificationRepository;
  private queueService: QueueService;
  private clientId: string;

  constructor(
    queueService: QueueService,
    private readonly app: MercadoLivre = MercadoLivre.createAppConfig() as MercadoLivre,
    private readonly tokenMlbService: TokenMlbService = new TokenMlbService(app),
    private readonly apiService: ApiMlbService = new ApiMlbService(tokenMlbService, app)
  ) {
    this.notificationRepository = new WebhookNotificationRepository();
    this.queueService = queueService;
    this.clientId = this.app.clientId;
  }

  async buscarNotificacoesPerdidas(): Promise<any[]> {
    try {
      const token = await this.tokenMlbService.getAccessToken();
      const userId = await this.tokenMlbService.getUserId();

      if (!token || !this.clientId || !userId) {
        throw new Error(`Token, App ID ou User ID não disponível. UserID: ${userId}`);
      }

      logger.info({
        context: 'NotificationRecoveryService.buscarNotificacoesPerdidas',
        message: `Tentando buscar notificações perdidas (App: ${this.clientId}, User: ${userId})`,
      });

      const messages = await this.apiService.getMissedFeeds(this.clientId, userId);
      logger.info({
        context: 'NotificationRecoveryService.buscarNotificacoesPerdidas',
        message: `${messages.length} notificação(ões) perdida(s) encontrada(s)`,
      });

      return messages;
    } catch (error: any) {
      logger.error({
        context: 'NotificationRecoveryService.buscarNotificacoesPerdidas',
        message: `Erro crítico ao buscar notificações perdidas: ${error.message}`,
        error: error.message,
      });
      return [];
    }
  }

  async salvarNotificacao(notificationData: any): Promise<WebhookNotification> {
    const notification = new WebhookNotification(
      notificationData._id || null,
      notificationData.resource || null,
      notificationData.user_id || null,
      notificationData.topic || null,
      notificationData.application_id || null,
      notificationData.attempts?.toString() || '0',
      notificationData.sent ? new Date(notificationData.sent) : undefined,
      new Date(),
      notificationData.request || notificationData,
      notificationData.response || null,
      false
    );

    const saved = await this.notificationRepository.create(notification);
    logger.info({
      context: 'NotificationRecoveryService.salvarNotificacao',
      message: `Notificação salva no histórico: ${notificationData._id} (Tópico: ${notificationData.topic})`,
    });

    return saved;
  }

  async processarNotificacoesPerdidas(): Promise<{
    total: number;
    processadas: number;
    erros: number;
  }> {
    try {
      logger.info({
        context: 'NotificationRecoveryService.processarNotificacoesPerdidas',
        message: 'Iniciando recuperação de notificações perdidas...',
      });

      const notificacoesPerdidas = await this.buscarNotificacoesPerdidas();

      if (!notificacoesPerdidas || notificacoesPerdidas.length === 0) {
        logger.info({
          context: 'NotificationRecoveryService.processarNotificacoesPerdidas',
          message: 'Nenhuma notificação perdida encontrada na API',
        });
        return { total: 0, processadas: 0, erros: 0 };
      }

      let processadas = 0;
      let erros = 0;

      for (const notificacao of notificacoesPerdidas) {
        try {
          await this.salvarNotificacao(notificacao);

          const resource = notificacao.resource || '';
          const topic = notificacao.topic || '';

          if (topic === 'orders' || resource.includes('/orders/')) {
            const orderId = resource.split('/').pop();
            this.queueService.adicionar({
              tipo: 'order',
              orderId: orderId,
              notificationId: notificacao._id,
              isRecuperacao: true,
            });
            processadas++;
          } else {
            logger.info({
              context: 'NotificationRecoveryService.processarNotificacoesPerdidas',
              message: `Notificação perdida ignorada - Topic: ${topic} | Resource: ${resource}`,
            });
          }
        } catch (error: any) {
          erros++;
          logger.error({
            context: 'NotificationRecoveryService.processarNotificacoesPerdidas',
            message: `Erro ao processar notificação perdida ${notificacao._id}: ${error.message}`,
            error: error.message,
          });
        }
      }

      logger.info({
        context: 'NotificationRecoveryService.processarNotificacoesPerdidas',
        message: `Recuperação concluída: ${processadas} enfileiradas, ${erros} erros`,
      });

      return { total: notificacoesPerdidas.length, processadas, erros };
    } catch (error: any) {
      logger.error({
        context: 'NotificationRecoveryService.processarNotificacoesPerdidas',
        message: `Erro crítico ao processar notificações perdidas: ${error.message}`,
        error: error.message,
      });
      throw error;
    }
  }

  async buscarNotificacoesNaoProcessadas(limit: number = 100): Promise<WebhookNotification[]> {
    try {
      return await this.notificationRepository.findUnprocessed(limit);
    } catch (error: any) {
      logger.error({
        context: 'NotificationRecoveryService.buscarNotificacoesNaoProcessadas',
        message: `Erro ao buscar notificações não processadas: ${error.message}`,
        error: error.message,
      });
      throw error;
    }
  }

  async reprocessarNotificacoesNaoProcessadas(): Promise<{
    total: number;
    reprocessadas: number;
  }> {
    try {
      logger.info({
        context: 'NotificationRecoveryService.reprocessarNotificacoesNaoProcessadas',
        message: 'Iniciando reprocessamento de notificações não processadas do BD...',
      });

      const notificacoes = await this.buscarNotificacoesNaoProcessadas(100);

      if (!notificacoes || notificacoes.length === 0) {
        logger.info({
          context: 'NotificationRecoveryService.reprocessarNotificacoesNaoProcessadas',
          message: 'Nenhuma notificação não processada encontrada no banco',
        });
        return { total: 0, reprocessadas: 0 };
      }

      logger.info({
        context: 'NotificationRecoveryService.reprocessarNotificacoesNaoProcessadas',
        message: `${notificacoes.length} notificação(ões) não processada(s) encontrada(s) no banco`,
      });

      let reprocessadas = 0;

      for (const notificacao of notificacoes) {
        try {
          const resource = notificacao.resource || '';
          const topic = notificacao.topic || '';

          if (topic === 'orders' || resource.includes('/orders/')) {
            const orderId = resource.split('/').pop();
            this.queueService.adicionar({
              tipo: 'order',
              orderId: orderId,
              notificationId: notificacao.notificationId,
              isReprocessamento: true,
            });
            reprocessadas++;
          }
        } catch (error: any) {
          logger.error({
            context: 'NotificationRecoveryService.reprocessarNotificacoesNaoProcessadas',
            message: `Erro ao reprocessar notificação ${notificacao.notificationId}: ${error.message}`,
            error: error.message,
          });
        }
      }

      logger.info({
        context: 'NotificationRecoveryService.reprocessarNotificacoesNaoProcessadas',
        message: `Reprocessamento iniciado: ${reprocessadas} notificações adicionadas à fila`,
      });

      return { total: notificacoes.length, reprocessadas };
    } catch (error: any) {
      logger.error({
        context: 'NotificationRecoveryService.reprocessarNotificacoesNaoProcessadas',
        message: `Erro ao reprocessar notificações: ${error.message}`,
        error: error.message,
      });
      throw error;
    }
  }
}

