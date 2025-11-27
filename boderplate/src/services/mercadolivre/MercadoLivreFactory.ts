/**
 * Factory para criar e gerenciar instâncias dos serviços do Mercado Livre
 * Substitui o MercadoLivreModule para simplificar a arquitetura
 */
import { MercadoLivre } from '../../entities/MercadoLivre';
import { TokenMlbService } from './mlb_api/TokenMlbService';
import { ApiMlbService } from './mlb_api/ApiMlbService';
import { AuthMercadoLivreService } from './mlb_api/AuthMercadoLivreService';
import { QueueService } from './QueueService';
import { NotificationRecoveryService } from './NotificationRecoveryService';
import { OrderProcessingService } from './OrderProcessingService';
import { WebhookNotificationRepository } from '../../repositories/mercadolivre/WebhookNotificationRepository';
import { AuthStateService } from '../AuthStateService';
import { UserMarketplaceRepository } from '../../repositories/UserMarketplaceRepository';
import { AuthMercadoLivreRepository } from '../../repositories/mercadolivre/AuthMercadoLivreRepository';

// Instâncias singleton
let appInstance: MercadoLivre | null = null;
let tokenServiceInstance: TokenMlbService | null = null;
let apiServiceInstance: ApiMlbService | null = null;
let orderProcessingServiceInstance: OrderProcessingService | null = null;
let queueServiceInstance: QueueService | null = null;
let notificationRecoveryServiceInstance: NotificationRecoveryService | null = null;
let authServiceInstance: AuthMercadoLivreService | null = null;
let webhookNotificationRepositoryInstance: WebhookNotificationRepository | null = null;

/**
 * Obtém ou cria a instância do app MercadoLivre
 */
export function getMercadoLivreApp(): MercadoLivre {
  if (!appInstance) {
    appInstance = MercadoLivre.createAppConfig() as MercadoLivre;
  }
  return appInstance;
}

/**
 * Obtém ou cria a instância do TokenMlbService
 */
export function getTokenService(): TokenMlbService {
  if (!tokenServiceInstance) {
    tokenServiceInstance = new TokenMlbService(getMercadoLivreApp());
  }
  return tokenServiceInstance;
}

/**
 * Obtém ou cria a instância do ApiMlbService
 */
export function getApiService(): ApiMlbService {
  if (!apiServiceInstance) {
    apiServiceInstance = new ApiMlbService(getTokenService(), getMercadoLivreApp());
  }
  return apiServiceInstance;
}

/**
 * Obtém ou cria a instância do OrderProcessingService
 */
export function getOrderProcessingService(): OrderProcessingService {
  if (!orderProcessingServiceInstance) {
    orderProcessingServiceInstance = new OrderProcessingService(getApiService());
  }
  return orderProcessingServiceInstance;
}

/**
 * Obtém ou cria a instância do WebhookNotificationRepository
 */
export function getWebhookNotificationRepository(): WebhookNotificationRepository {
  if (!webhookNotificationRepositoryInstance) {
    webhookNotificationRepositoryInstance = new WebhookNotificationRepository();
  }
  return webhookNotificationRepositoryInstance;
}

/**
 * Obtém ou cria a instância do QueueService
 */
export function getQueueService(): QueueService {
  if (!queueServiceInstance) {
    queueServiceInstance = new QueueService(
      getOrderProcessingService(),
      getWebhookNotificationRepository()
    );
  }
  return queueServiceInstance;
}

/**
 * Obtém ou cria a instância do NotificationRecoveryService
 */
export function getNotificationRecoveryService(): NotificationRecoveryService {
  if (!notificationRecoveryServiceInstance) {
    notificationRecoveryServiceInstance = new NotificationRecoveryService(
      getQueueService(),
      getMercadoLivreApp(),
      getTokenService(),
      getApiService()
    );
  }
  return notificationRecoveryServiceInstance;
}

/**
 * Obtém ou cria a instância do AuthMercadoLivreService
 */
export function getAuthService(): AuthMercadoLivreService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthMercadoLivreService(
      new AuthStateService('mercadolivre'),
      getMercadoLivreApp()
    );
  }
  return authServiceInstance;
}

/**
 * Cria uma entidade MercadoLivre completa a partir dos dados do banco
 */
export async function createMercadoLivreEntity(userMarketplaceId: string): Promise<MercadoLivre | null> {
  try {
    const userMarketplaceRepo = new UserMarketplaceRepository();
    const authMercadoLivreRepo = new AuthMercadoLivreRepository();

    const userMarketplace = await userMarketplaceRepo.findById(userMarketplaceId);
    if (!userMarketplace || userMarketplace.type !== 'ml') {
      return null;
    }

    const authMercadoLivre = await authMercadoLivreRepo.findByUserMarketplaceId(userMarketplaceId);

    return MercadoLivre.fromEnv(
      userMarketplaceId,
      userMarketplace.nome,
      {
        id: userMarketplace.id,
        userId: authMercadoLivre?.userId,
        applicationId: process.env.CLIENT_KEY_ML,
        status: userMarketplace.status,
        createdIn: userMarketplace.createdIn,
        accessToken: userMarketplace.accessToken,
        refreshToken: userMarketplace.refreshToken,
        scope: authMercadoLivre?.scope,
      }
    );
  } catch (error) {
    console.error('Erro ao criar entidade MercadoLivre:', error);
    return null;
  }
}

/**
 * Busca a entidade MercadoLivre ativa (primeira encontrada com status=true e type='ml')
 */
export async function findActiveMercadoLivreEntity(): Promise<MercadoLivre | null> {
  try {
    const userMarketplaceRepo = new UserMarketplaceRepository();
    const allUsers = await userMarketplaceRepo.findAll();
    const mlUser = allUsers.find((u) => u.type === 'ml' && u.status === true);

    if (!mlUser || !mlUser.id) {
      return null;
    }

    return createMercadoLivreEntity(mlUser.id);
  } catch (error) {
    console.error('Erro ao buscar entidade MercadoLivre ativa:', error);
    return null;
  }
}

/**
 * Limpa todas as instâncias singleton (útil para testes)
 */
export function clearInstances(): void {
  appInstance = null;
  tokenServiceInstance = null;
  apiServiceInstance = null;
  orderProcessingServiceInstance = null;
  queueServiceInstance = null;
  notificationRecoveryServiceInstance = null;
  authServiceInstance = null;
  webhookNotificationRepositoryInstance = null;
}

