import { Request, Response } from 'express';
import { WebhookNotification } from '../entities/WebhookNotification';
import logger from '../utils/logger';
import {
  getQueueService,
  getNotificationRecoveryService,
  getWebhookNotificationRepository,
  getTokenService,
} from '../services/mercadolivre/MercadoLivreFactory';

export class WebhookController {
  private readonly queueService = getQueueService();
  private readonly notificationRecoveryService = getNotificationRecoveryService();
  private readonly notificationRepository = getWebhookNotificationRepository();
  private readonly tokenService = getTokenService();

  public handleWebhook = async (req: Request, res: Response) => {
    res.status(200).send('OK');

    const jsonPayload = req.body;
    if (!jsonPayload || Object.keys(jsonPayload).length === 0) {
      return;
    }

    const resource = jsonPayload.resource || '';
    const topic = jsonPayload.topic || '';

    const topicosDeInteresse = ['orders'];
    const resourceDeInteresse = resource.includes('/orders/');

    if (!topicosDeInteresse.includes(topic) && !resourceDeInteresse) {
      return;
    }

    logger.info({
      context: 'WebhookController.handleWebhook',
      message: `Notificação recebida: Topic: ${topic} | Resource: ${resource}`,
    });

    try {
      const notification = new WebhookNotification(
        jsonPayload._id || null,
        jsonPayload.resource || null,
        jsonPayload.user_id || null,
        jsonPayload.topic || null,
        jsonPayload.application_id || null,
        jsonPayload.attempts?.toString() || '0',
        jsonPayload.sent ? new Date(jsonPayload.sent) : undefined,
        new Date(),
        jsonPayload,
        null,
        false
      );

      await this.notificationRepository.create(notification);

      if (topic === 'orders' || resource.includes('/orders/')) {
        const orderId = resource.split('/').pop();
        logger.info({
          context: 'WebhookController.handleWebhook',
          message: `Adicionando ordem ${orderId} à fila`,
        });
        this.queueService.adicionar({
          tipo: 'order',
          orderId: orderId,
          notificationId: jsonPayload._id,
        });
      } else {
        logger.warn({
          context: 'WebhookController.handleWebhook',
          message: `Notificação salva mas não processada (tópico não tratado): ${topic}`,
        });
      }
    } catch (error: any) {
      logger.error({
        context: 'WebhookController.handleWebhookError',
        message: `ERRO ao salvar/enfileirar notificação: ${error.message}`,
        error: error.message,
      });
    }
  };

  public health = async (req: Request, res: Response) => {
    try {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        queue: this.queueService.getEstatisticas(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public status = async (req: Request, res: Response) => {
    try {
      const tokenInfo = await this.tokenService.getTokenInfo();
      const queueStats = this.queueService.getEstatisticas();

      res.json({
        status: 'running',
        token: tokenInfo,
        queue: queueStats,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public processarOrdem = async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      logger.info({
        context: 'WebhookController.processarOrdem',
        message: `Processamento manual solicitado para ordem: ${orderId}`,
      });

      this.queueService.adicionar({
        tipo: 'order',
        orderId: orderId,
      });

      res.json({
        message: `Ordem ${orderId} adicionada à fila`,
        queue: this.queueService.getEstatisticas(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public processarPacote = async (req: Request, res: Response) => {
    try {
      const { packId } = req.params;
      logger.info({
        context: 'WebhookController.processarPacote',
        message: `Processamento manual de pacote solicitado: ${packId}`,
      });

      this.queueService.adicionar({
        tipo: 'pack',
        packId: packId,
      });

      res.json({
        message: `Pacote ${packId} adicionado à fila`,
        queue: this.queueService.getEstatisticas(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public limparFila = (req: Request, res: Response) => {
    const tamanhoAntes = this.queueService.limpar();
    res.json({
      message: `Fila limpa. ${tamanhoAntes} tarefas removidas.`,
      queue: this.queueService.getEstatisticas(),
    });
  };

  public recuperarNotificacoes = async (req: Request, res: Response) => {
    try {
      logger.info({
        context: 'WebhookController.recuperarNotificacoes',
        message: 'Recuperação manual de notificações perdidas solicitada',
      });

      const resultado = await this.notificationRecoveryService.processarNotificacoesPerdidas();
      res.json({
        success: true,
        message: 'Recuperação de notificações concluída',
        ...resultado,
        queue: this.queueService.getEstatisticas(),
      });
    } catch (error: any) {
      logger.error({
        context: 'WebhookController.recuperarNotificacoes',
        message: `Erro ao recuperar notificações: ${error.message}`,
        error: error.message,
      });
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public reprocessarNotificacoes = async (req: Request, res: Response) => {
    try {
      logger.info({
        context: 'WebhookController.reprocessarNotificacoes',
        message: 'Reprocessamento de notificações não processadas solicitado',
      });

      const resultado = await this.notificationRecoveryService.reprocessarNotificacoesNaoProcessadas();
      res.json({
        success: true,
        message: 'Reprocessamento iniciado',
        ...resultado,
        queue: this.queueService.getEstatisticas(),
      });
    } catch (error: any) {
      logger.error({
        context: 'WebhookController.reprocessarNotificacoes',
        message: `Erro ao reprocessar notificações: ${error.message}`,
        error: error.message,
      });
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public historicoNotificacoes = async (req: Request, res: Response) => {
    try {
      const { limit = 50, offset = 0, processed, topic } = req.query;

      const filters: any = {};
      if (processed !== undefined) {
        filters.processed = processed === 'true';
      }
      if (topic) {
        filters.topic = topic;
      }

      const result = await this.notificationRepository.findAll(
        parseInt(limit as string),
        parseInt(offset as string),
        filters
      );

      res.json({
        success: true,
        total: result.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        data: result.data,
      });
    } catch (error: any) {
      logger.error({
        context: 'WebhookController.historicoNotificacoes',
        message: `Erro ao consultar histórico: ${error.message}`,
        error: error.message,
      });
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public estatisticasNotificacoes = async (req: Request, res: Response) => {
    try {
      const stats = await this.notificationRepository.getStatistics();
      res.json({
        success: true,
        estatisticas: stats,
        queue: this.queueService.getEstatisticas(),
      });
    } catch (error: any) {
      logger.error({
        context: 'WebhookController.estatisticasNotificacoes',
        message: `Erro ao buscar estatísticas: ${error.message}`,
        error: error.message,
      });
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public getAllWebhookLogs = async (req: Request, res: Response) => {
    try {
      const result = await this.notificationRepository.findAll(100, 0);
      res.status(200).json(result.data);
    } catch (error: any) {
      logger.error({
        context: 'WebhookController.getAllWebhookLogs',
        message: `Erro ao buscar logs: ${error.message}`,
        error: error.message,
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
