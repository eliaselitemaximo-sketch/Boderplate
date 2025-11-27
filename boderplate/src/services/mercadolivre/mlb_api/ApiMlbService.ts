import axios, { AxiosInstance } from 'axios';
import logger from '../../../utils/logger';
import { TokenMlbService } from './TokenMlbService';
import { MercadoLivre } from '../../../entities/MercadoLivre';

interface ApiOptions {
  retries?: number;
  delay?: number;
}

export class ApiMlbService {
  private apiClient: AxiosInstance;
  private maxRetries: number;
  private retryDelay: number;

  constructor(
    private readonly tokenService: TokenMlbService = new TokenMlbService(),
    private readonly app: MercadoLivre = MercadoLivre.createAppConfig() as MercadoLivre
  ) {
    this.apiClient = axios.create({
      baseURL: 'https://api.mercadolibre.com',
      timeout: this.app.timeoutMs,
    });

    this.maxRetries = this.app.maxRetries;
    this.retryDelay = this.app.retryDelayMs;
  }

  private async makeRequest<T>(method: 'get' | 'post', url: string, options?: ApiOptions) {
    const retries = options?.retries ?? this.maxRetries;
    const delay = options?.delay ?? this.retryDelay;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const token = await this.tokenService.getAccessToken();
        const response = await this.apiClient.request<T>({
          method,
          url,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return response.data as T;
      } catch (error: any) {
        const status = error?.response?.status;
        const data = error?.response?.data;
        const isRetryable = status === 429 || (status >= 500 && status < 600);

        logger.error({
          context: 'ApiMlbService.makeRequest',
          message: `Erro na chamada ${method.toUpperCase()} ${url}`,
          status,
          response: data,
          attempt,
          retries,
        });

        if (!isRetryable || attempt === retries) {
          throw new Error(data?.message || `Erro ao chamar API do Mercado Livre (${status})`);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(`Falha ao chamar API do Mercado Livre após ${retries} tentativas (${method.toUpperCase()} ${url})`);
  }

  async get<T = any>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.makeRequest<T>('get', endpoint, options);
  }

  async getOrder(orderId: string) {
    return this.get(`/orders/${orderId}`);
  }

  async getShipment(shipmentId: string) {
    return this.get(`/shipments/${shipmentId}`);
  }

  async getPayment(paymentId: string) {
    return this.get(`/collections/${paymentId}`);
  }

  async getPack(packId: string) {
    return this.get(`/packs/${packId}`);
  }

  async getMediation(mediationId: string) {
    return this.get(`/mediations/${mediationId}`);
  }

  async getMissedFeeds(appId: string, userId: string): Promise<any[]> {
    return this.get<any[]>(`/missed_feeds?app_id=${appId}&user_id=${userId}`);
  }
}

