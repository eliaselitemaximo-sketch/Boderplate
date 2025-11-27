import { OrderProcessingService } from './OrderProcessingService';
import { WebhookNotificationRepository } from '../../repositories/mercadolivre/WebhookNotificationRepository';
import logger from '../../utils/logger';

interface QueueTask {
  id: string;
  tipo: 'order' | 'pack';
  orderId?: string;
  packId?: string;
  notificationId?: string;
  tentativas: number;
  maxTentativas: number;
  adicionadoEm: Date;
  isRecuperacao?: boolean;
  isReprocessamento?: boolean;
}

interface QueueStatistics {
  totalRecebido: number;
  totalProcessado: number;
  totalErros: number;
  totalRetries: number;
  filaAtual: number;
  tarefasAtivas: number;
  processando: boolean;
}

export class QueueService {
  private fila: QueueTask[] = [];
  private processando: boolean = false;
  private tarefasAtivas: number = 0;
  private maxConcorrente: number;
  private retryDelay: number;
  private maxTentativas: number;
  private orderProcessingService: OrderProcessingService;
  private notificationRepository: WebhookNotificationRepository;
  private estatisticas: QueueStatistics;

  constructor(
    orderProcessingService: OrderProcessingService = new OrderProcessingService(),
    notificationRepository: WebhookNotificationRepository = new WebhookNotificationRepository()
  ) {
    this.maxConcorrente = parseInt(process.env.QUEUE_CONCURRENT || '1');
    this.retryDelay = parseInt(process.env.QUEUE_RETRY_DELAY || '5000');
    this.maxTentativas = parseInt(process.env.API_MAX_RETRIES || '3');
    this.orderProcessingService = orderProcessingService;
    this.notificationRepository = notificationRepository;
    this.estatisticas = {
      totalRecebido: 0,
      totalProcessado: 0,
      totalErros: 0,
      totalRetries: 0,
      filaAtual: 0,
      tarefasAtivas: 0,
      processando: false,
    };
  }

  adicionar(tarefa: Omit<QueueTask, 'id' | 'tentativas' | 'maxTentativas' | 'adicionadoEm'>): void {
    this.estatisticas.totalRecebido++;
    const task: QueueTask = {
      ...tarefa,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tentativas: 0,
      maxTentativas: this.maxTentativas,
      adicionadoEm: new Date(),
    };

    this.fila.push(task);
    this.estatisticas.filaAtual = this.fila.length;

    logger.info({
      context: 'QueueService.adicionar',
      message: `Tarefa adicionada à fila: ${task.tipo} | ID: ${task.orderId || task.packId || task.id} | Total na fila: ${this.fila.length}`,
    });

    this.processar();
  }

  private async processar(): Promise<void> {
    if (this.processando || this.tarefasAtivas >= this.maxConcorrente) {
      return;
    }

    if (this.fila.length === 0) {
      return;
    }

    this.processando = true;
    this.estatisticas.processando = true;
    const tarefa = this.fila.shift();
    this.estatisticas.filaAtual = this.fila.length;

    if (!tarefa) {
      this.processando = false;
      this.estatisticas.processando = false;
      return;
    }

    this.tarefasAtivas++;
    this.estatisticas.tarefasAtivas = this.tarefasAtivas;

    logger.info({
      context: 'QueueService.processar',
      message: `Processando tarefa: ${tarefa.tipo} - ${tarefa.id} (Tentativa ${tarefa.tentativas + 1}/${tarefa.maxTentativas})`,
    });

    try {
      await this.executarTarefa(tarefa);
      this.estatisticas.totalProcessado++;
      logger.info({
        context: 'QueueService.processar',
        message: `Tarefa concluída: ${tarefa.tipo} - ${tarefa.id}`,
      });

      if (tarefa.notificationId) {
        await this.marcarNotificacaoProcessada(tarefa.notificationId, null);
      }
    } catch (error: any) {
      logger.error({
        context: 'QueueService.processar',
        message: `Erro na tarefa ${tarefa.id}: ${error.message}`,
        error: error.message,
      });

      tarefa.tentativas++;
      if (tarefa.tentativas < tarefa.maxTentativas) {
        this.estatisticas.totalRetries++;
        logger.info({
          context: 'QueueService.processar',
          message: `Reagendando tarefa ${tarefa.id} - Tentativa ${tarefa.tentativas + 1}/${tarefa.maxTentativas}`,
        });

        setTimeout(() => {
          this.fila.push(tarefa);
          this.estatisticas.filaAtual = this.fila.length;
          this.processar();
        }, this.retryDelay);
      } else {
        this.estatisticas.totalErros++;
        logger.error({
          context: 'QueueService.processar',
          message: `Tarefa ${tarefa.id} falhou após ${tarefa.tentativas} tentativas`,
        });

        if (tarefa.notificationId) {
          await this.marcarNotificacaoProcessada(tarefa.notificationId, error.message);
        }
      }
    } finally {
      this.tarefasAtivas--;
      this.estatisticas.tarefasAtivas = this.tarefasAtivas;
      this.processando = false;
      this.estatisticas.processando = false;

      if (this.fila.length > 0) {
        setTimeout(() => this.processar(), 100);
      }
    }
  }

  private async executarTarefa(tarefa: QueueTask): Promise<void> {
    switch (tarefa.tipo) {
      case 'order':
        if (!tarefa.orderId) {
          throw new Error('orderId é obrigatório para tarefas do tipo "order"');
        }
        await this.orderProcessingService.processOrder(tarefa.orderId);
        break;

      case 'pack':
        if (!tarefa.packId) {
          throw new Error('packId é obrigatório para tarefas do tipo "pack"');
        }
        await this.orderProcessingService.processPack(tarefa.packId);
        break;

      default:
        throw new Error(`Tipo de tarefa desconhecido: ${tarefa.tipo}`);
    }
  }

  private async marcarNotificacaoProcessada(notificationId: string, error: string | null): Promise<void> {
    try {
      const notification = await this.notificationRepository.findByNotificationId(notificationId);
      if (notification) {
        await this.notificationRepository.updateByNotificationId(notificationId, {
          processed: !error,
          processedAt: new Date(),
          errorMessage: error || undefined,
        });
      }
    } catch (err: any) {
      logger.error({
        context: 'QueueService.marcarNotificacaoProcessada',
        message: `Erro ao marcar notificação como processada: ${err.message}`,
        error: err.message,
      });
    }
  }

  limpar(): number {
    const tamanhoAntes = this.fila.length;
    this.fila = [];
    this.estatisticas.filaAtual = 0;
    logger.info({
      context: 'QueueService.limpar',
      message: `Fila limpa manualmente. ${tamanhoAntes} tarefas removidas.`,
    });
    return tamanhoAntes;
  }

  getEstatisticas(): QueueStatistics {
    return {
      ...this.estatisticas,
      filaAtual: this.fila.length,
      tarefasAtivas: this.tarefasAtivas,
      processando: this.processando,
    };
  }
}

