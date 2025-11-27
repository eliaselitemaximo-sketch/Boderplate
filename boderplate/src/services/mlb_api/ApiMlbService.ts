import axios, { AxiosInstance } from 'axios';
import logger from '../../utils/logger';
import { TokenMlbService } from './TokenMlbService';

interface ApiOptions {
  retries?: number;
  delay?: number;
}

export class ApiMlbService {
  private apiClient: AxiosInstance;
  private tokenService: TokenMlbService;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.apiClient = axios.create({
      baseURL: 'https://api.mercadolibre.com',
      timeout: parseInt(process.env.API_TIMEOUT || '10000', 10),
    });

    this.tokenService = new TokenMlbService();
    this.maxRetries = parseInt(process.env.API_MAX_RETRIES || '3', 10);
    this.retryDelay = parseInt(process.env.API_RETRY_DELAY || '2000', 10);
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

        return response.data;
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
  }

  async get<T>(endpoint: string, options?: ApiOptions): Promise<T> {
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

  async getMissedFeeds(appId: string, userId: string) {
    return this.get(`/missed_feeds?app_id=${appId}&user_id=${userId}`);
  }
}

