import { UserMarketplaceRepository } from '../../../repositories/UserMarketplaceRepository';
import { AuthMercadoLivreRepository } from '../../../repositories/mercadolivre/AuthMercadoLivreRepository';
import logger from '../../../utils/logger';
import { MercadoLivre } from '../../../entities/MercadoLivre';

export class TokenMlbService {
  private userMarketplaceRepository: UserMarketplaceRepository;
  private authMercadoLivreRepository: AuthMercadoLivreRepository;
  private tokenCache: string | null = null;
  private readonly app: MercadoLivre;

  constructor(
    app: MercadoLivre = MercadoLivre.createAppConfig() as MercadoLivre,
    userMarketplaceRepository: UserMarketplaceRepository = new UserMarketplaceRepository(),
    authMercadoLivreRepository: AuthMercadoLivreRepository = new AuthMercadoLivreRepository()
  ) {
    this.app = app;
    this.userMarketplaceRepository = userMarketplaceRepository;
    this.authMercadoLivreRepository = authMercadoLivreRepository;
  }

  async getUserMarketplace(): Promise<{ id: string; accessToken?: string; refreshToken?: string } | null> {
    try {
      const allUsers = await this.userMarketplaceRepository.findAll();
      const mlUser = allUsers.find((u) => u.type === 'ml' && u.status === true);

      if (!mlUser || !mlUser.id) {
        throw new Error('Nenhum user marketplace do tipo "ml" ativo encontrado');
      }

      return {
        id: mlUser.id,
        accessToken: mlUser.accessToken,
        refreshToken: mlUser.refreshToken,
      };
    } catch (error: any) {
      logger.error({ error: error.message, context: 'TokenMlbService.getUserMarketplace' });
      throw error;
    }
  }

  async getMercadoLivreUserId(userMarketplaceId: string): Promise<string | null> {
    try {
      const auth = await this.authMercadoLivreRepository.findByUserMarketplaceId(userMarketplaceId);
      return auth?.userId || null;
    } catch (error: any) {
      logger.error({ error: error.message, context: 'TokenMlbService.getMercadoLivreUserId' });
      return null;
    }
  }

  async getAccessToken(): Promise<string> {
    try {
      if (this.tokenCache) {
        return this.tokenCache;
      }

      const userMarketplace = await this.getUserMarketplace();

      if (!userMarketplace) {
        throw new Error('User marketplace não encontrado');
      }

      if (!userMarketplace.accessToken) {
        throw new Error('Access token não encontrado no banco de dados');
      }

      this.tokenCache = userMarketplace.accessToken;
      return userMarketplace.accessToken;
    } catch (error: any) {
      logger.error({
        error: error.message,
        context: 'TokenMlbService.getAccessToken',
      });
      throw error;
    }
  }

  clearCache(): void {
    this.tokenCache = null;
  }

  async getTokenInfo(): Promise<{ accessToken: string; userId?: string } | null> {
    try {
      const userMarketplace = await this.getUserMarketplace();
      if (!userMarketplace || !userMarketplace.accessToken) {
        return null;
      }

      const userId = await this.getMercadoLivreUserId(userMarketplace.id);

      return {
        accessToken: userMarketplace.accessToken,
        userId: userId || undefined,
      };
    } catch (error: any) {
      logger.error({
        error: error.message,
        context: 'TokenMlbService.getTokenInfo',
      });
      return null;
    }
  }

  async getUserId(): Promise<string | null> {
    try {
      const userMarketplace = await this.getUserMarketplace();
      if (!userMarketplace) {
        return null;
      }

      return await this.getMercadoLivreUserId(userMarketplace.id);
    } catch (error: any) {
      logger.error({
        error: error.message,
        context: 'TokenMlbService.getUserId',
      });
      return null;
    }
  }
}

