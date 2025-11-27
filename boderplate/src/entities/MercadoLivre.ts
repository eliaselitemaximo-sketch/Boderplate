/**
 * Entidade principal do Mercado Livre
 * Consolida todos os parâmetros e características necessários para o app de vendas
 * Inclui: configurações do app, autenticação, webhooks e estruturas de dados de vendas
 */

// ============================================================================
// INTERFACES E TIPOS PARA DADOS DE VENDAS
// ============================================================================

export interface MercadoLivreOrderItem {
  id?: string;
  item?: {
    id?: string;
    title?: string;
    seller_sku?: string;
    variation_id?: string;
  };
  quantity?: number;
  unit_price?: number;
  sale_fee?: number;
  listing_type_id?: string;
}

export interface MercadoLivreBuyer {
  id?: number;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  firstname?: string;
  lastname?: string;
}

export interface MercadoLivrePayment {
  id?: string;
  payment_method_id?: string;
  payment_type?: string;
  installments?: number;
  total_paid_amount?: number;
  date_approved?: string;
  financing_fee?: {
    amount?: number;
  };
  shipping_cost?: number;
  refunds?: Array<{
    amount?: number;
    date_created?: string;
  }>;
}

export interface MercadoLivreShipping {
  id?: number;
  status?: string;
  substatus?: string;
  tracking_number?: string;
  date_created?: string;
  cost?: number;
  cost_type?: string;
  receiver_address?: {
    zip_code?: string;
    address_line?: string;
    city?: string | { name?: string };
    state?: string | { name?: string };
    country?: string | { name?: string };
  };
  shipping_method?: {
    name?: string;
  };
  logistic_type?: string;
}

export interface MercadoLivreShipment {
  id?: number;
  status?: string;
  substatus?: string;
  tracking_number?: string;
  date_created?: string;
  estimated_delivery_time?: {
    date?: string;
  };
  shipping_option?: {
    estimated_delivery_time?: {
      date?: string;
    };
    list_cost?: number;
  };
  receiver_address?: {
    zip_code?: string;
    address_line?: string;
    city?: string | { name?: string };
    state?: string | { name?: string };
    country?: string | { name?: string };
  };
  destination?: {
    shipping_address?: {
      zip_code?: string;
      address_line?: string;
      city?: string | { name?: string };
      state?: string | { name?: string };
      country?: string | { name?: string };
    };
  };
  status_history?: {
    date_delivered?: string;
  };
  carrier?: {
    name?: string;
  };
  tracking_method?: string;
  logistic?: {
    type?: string;
  };
  lead_time?: {
    list_cost?: number;
  };
  cost_type?: string;
}

export interface MercadoLivreOrder {
  id?: number;
  pack_id?: string;
  status?: string;
  status_detail?: string;
  date_created?: string;
  last_updated?: string;
  date_closed?: string;
  total_amount?: number;
  paid_amount?: number;
  currency_id?: string;
  order_items?: MercadoLivreOrderItem[];
  buyer?: MercadoLivreBuyer;
  shipping?: MercadoLivreShipping;
  payments?: MercadoLivrePayment[];
  context?: {
    channel?: string;
  };
  cancel_detail?: {
    date_created?: string;
    reason?: string;
    cancelled_by?: string;
  };
  mediations?: Array<{
    id?: number;
  }>;
  order_costs?: {
    shipping_fee?: number;
    seller_shipping_discount?: number;
  };
}

export interface MercadoLivreOrderData {
  order: MercadoLivreOrder;
  shipment?: MercadoLivreShipment;
  payment?: MercadoLivrePayment;
}

export interface MercadoLivrePack {
  pack_id?: string;
  orders?: Array<{
    id: number;
  }>;
}

// ============================================================================
// CLASSE WEBHOOK NOTIFICATION (integrada)
// ============================================================================

export class MercadoLivreWebhookNotification {
  private _id?: string;
  private _notificationId?: string;
  private _resource?: string;
  private _userId?: string;
  private _topic?: string;
  private _applicationId?: string;
  private _attempts?: string;
  private _sentAt?: Date;
  private _receivedAt?: Date;
  private _requestData?: any;
  private _responseData?: any;
  private _processed: boolean;
  private _processedAt?: Date;
  private _errorMessage?: string;
  private _updatedAt?: Date;

  constructor(
    notificationId?: string,
    resource?: string,
    userId?: string,
    topic?: string,
    applicationId?: string,
    attempts?: string,
    sentAt?: Date,
    receivedAt?: Date,
    requestData?: any,
    responseData?: any,
    processed: boolean = false,
    processedAt?: Date,
    errorMessage?: string,
    id?: string,
    updatedAt?: Date
  ) {
    this._id = id;
    this._notificationId = notificationId;
    this._resource = resource;
    this._userId = userId;
    this._topic = topic;
    this._applicationId = applicationId;
    this._attempts = attempts;
    this._sentAt = sentAt;
    this._receivedAt = receivedAt ?? new Date();
    this._requestData = requestData;
    this._responseData = responseData;
    this._processed = processed;
    this._processedAt = processedAt;
    this._errorMessage = errorMessage;
    this._updatedAt = updatedAt;
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get notificationId(): string | undefined {
    return this._notificationId;
  }

  get resource(): string | undefined {
    return this._resource;
  }

  get userId(): string | undefined {
    return this._userId;
  }

  get topic(): string | undefined {
    return this._topic;
  }

  get applicationId(): string | undefined {
    return this._applicationId;
  }

  get attempts(): string | undefined {
    return this._attempts;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  get receivedAt(): Date | undefined {
    return this._receivedAt;
  }

  get requestData(): any {
    return this._requestData;
  }

  get responseData(): any {
    return this._responseData;
  }

  get processed(): boolean {
    return this._processed;
  }

  get processedAt(): Date | undefined {
    return this._processedAt;
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  // Setters
  set id(value: string | undefined) {
    this._id = value;
  }

  set notificationId(value: string | undefined) {
    this._notificationId = value;
  }

  set resource(value: string | undefined) {
    this._resource = value;
  }

  set userId(value: string | undefined) {
    this._userId = value;
  }

  set topic(value: string | undefined) {
    this._topic = value;
  }

  set applicationId(value: string | undefined) {
    this._applicationId = value;
  }

  set attempts(value: string | undefined) {
    this._attempts = value;
  }

  set sentAt(value: Date | undefined) {
    this._sentAt = value;
  }

  set receivedAt(value: Date | undefined) {
    this._receivedAt = value;
  }

  set requestData(value: any) {
    this._requestData = value;
  }

  set responseData(value: any) {
    this._responseData = value;
  }

  set processed(value: boolean) {
    this._processed = value;
  }

  set processedAt(value: Date | undefined) {
    this._processedAt = value;
  }

  set errorMessage(value: string | undefined) {
    this._errorMessage = value;
  }

  set updatedAt(value: Date | undefined) {
    this._updatedAt = value;
  }

  // Métodos auxiliares
  isOrderNotification(): boolean {
    return this._topic === 'orders' || (this._resource?.includes('/orders/') ?? false);
  }

  getOrderId(): string | null {
    if (!this._resource) return null;
    const match = this._resource.match(/\/orders\/(\d+)/);
    return match ? match[1] : null;
  }
}

// ============================================================================
// ENTIDADE PRINCIPAL MERCADO LIVRE
// ============================================================================

export class MercadoLivre {
  // Identificação
  private _id?: string;
  private _userMarketplaceId: string;
  private _userId?: string; // User ID do Mercado Livre
  private _applicationId?: string; // App ID do Mercado Livre

  // Dados do Usuário Marketplace
  private _nome: string;
  private _status: boolean;
  private _createdIn?: Date;

  // Autenticação OAuth
  private _accessToken?: string;
  private _refreshToken?: string;
  private _tokenType?: string;
  private _expiresIn?: number;
  private _scope?: string;
  private _tokenExpiresAt?: Date;

  // Configurações do App (substitui MercadoLivreApp)
  private _clientId: string;
  private _clientSecret: string;
  private _redirectUri: string;
  private _webhookUrl: string;
  private _appName: string;

  // Configurações Operacionais
  private _timeoutMs: number;
  private _maxRetries: number;
  private _retryDelayMs: number;
  private _apiDelayMs: number;
  private _queueConcurrent: number;
  private _queueRetryDelay: number;
  private _maxTentativas: number;

  // Estatísticas e Status
  private _lastTokenRefresh?: Date;
  private _lastApiCall?: Date;
  private _totalApiCalls: number;
  private _totalErrors: number;
  private _isAuthenticated: boolean;

  constructor(
    userMarketplaceId: string,
    nome: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    webhookUrl: string = '',
    appName: string = 'Marketplace Boilerplate',
    options?: {
      id?: string;
      userId?: string;
      applicationId?: string;
      status?: boolean;
      createdIn?: Date;
      accessToken?: string;
      refreshToken?: string;
      tokenType?: string;
      expiresIn?: number;
      scope?: string;
      timeoutMs?: number;
      maxRetries?: number;
      retryDelayMs?: number;
      apiDelayMs?: number;
      queueConcurrent?: number;
      queueRetryDelay?: number;
      maxTentativas?: number;
    }
  ) {
    this._userMarketplaceId = userMarketplaceId;
    this._nome = nome;
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._redirectUri = redirectUri;
    this._webhookUrl = webhookUrl;
    this._appName = appName;

    // Opções padrão
    this._id = options?.id;
    this._userId = options?.userId;
    this._applicationId = options?.applicationId;
    this._status = options?.status ?? true;
    this._createdIn = options?.createdIn;
    this._accessToken = options?.accessToken;
    this._refreshToken = options?.refreshToken;
    this._tokenType = options?.tokenType;
    this._expiresIn = options?.expiresIn;
    this._scope = options?.scope;

    // Configurações operacionais padrão
    this._timeoutMs = options?.timeoutMs ?? 10000;
    this._maxRetries = options?.maxRetries ?? 3;
    this._retryDelayMs = options?.retryDelayMs ?? 2000;
    this._apiDelayMs = options?.apiDelayMs ?? 200;
    this._queueConcurrent = options?.queueConcurrent ?? 1;
    this._queueRetryDelay = options?.queueRetryDelay ?? 5000;
    this._maxTentativas = options?.maxTentativas ?? 3;

    // Estatísticas
    this._totalApiCalls = 0;
    this._totalErrors = 0;
    this._isAuthenticated = !!this._accessToken;

    // Calcular expiração do token se fornecido
    if (this._expiresIn && !this._tokenExpiresAt) {
      this._tokenExpiresAt = new Date(Date.now() + this._expiresIn * 1000);
    }
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  get id(): string | undefined {
    return this._id;
  }

  get userMarketplaceId(): string {
    return this._userMarketplaceId;
  }

  get userId(): string | undefined {
    return this._userId;
  }

  get applicationId(): string | undefined {
    return this._applicationId;
  }

  get nome(): string {
    return this._nome;
  }

  get status(): boolean {
    return this._status;
  }

  get createdIn(): Date | undefined {
    return this._createdIn;
  }

  get accessToken(): string | undefined {
    return this._accessToken;
  }

  get refreshToken(): string | undefined {
    return this._refreshToken;
  }

  get tokenType(): string | undefined {
    return this._tokenType;
  }

  get expiresIn(): number | undefined {
    return this._expiresIn;
  }

  get scope(): string | undefined {
    return this._scope;
  }

  get tokenExpiresAt(): Date | undefined {
    return this._tokenExpiresAt;
  }

  // Configurações do App (compatibilidade com MercadoLivreApp)
  get name(): string {
    return this._appName;
  }

  get clientId(): string {
    return this._clientId;
  }

  get clientSecret(): string {
    return this._clientSecret;
  }

  get redirectUri(): string {
    return this._redirectUri;
  }

  get webhookUrl(): string {
    return this._webhookUrl;
  }

  get appName(): string {
    return this._appName;
  }

  get timeoutMs(): number {
    return this._timeoutMs;
  }

  get maxRetries(): number {
    return this._maxRetries;
  }

  get retryDelayMs(): number {
    return this._retryDelayMs;
  }

  get apiDelayMs(): number {
    return this._apiDelayMs;
  }

  get queueConcurrent(): number {
    return this._queueConcurrent;
  }

  get queueRetryDelay(): number {
    return this._queueRetryDelay;
  }

  get maxTentativas(): number {
    return this._maxTentativas;
  }

  get lastTokenRefresh(): Date | undefined {
    return this._lastTokenRefresh;
  }

  get lastApiCall(): Date | undefined {
    return this._lastApiCall;
  }

  get totalApiCalls(): number {
    return this._totalApiCalls;
  }

  get totalErrors(): number {
    return this._totalErrors;
  }

  get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  // ============================================================================
  // SETTERS
  // ============================================================================

  set id(value: string | undefined) {
    this._id = value;
  }

  set userId(value: string | undefined) {
    this._userId = value;
  }

  set applicationId(value: string | undefined) {
    this._applicationId = value;
  }

  set nome(value: string) {
    this._nome = value;
  }

  set status(value: boolean) {
    this._status = value;
  }

  set accessToken(value: string | undefined) {
    this._accessToken = value;
    this._isAuthenticated = !!value;
  }

  set refreshToken(value: string | undefined) {
    this._refreshToken = value;
  }

  set tokenType(value: string | undefined) {
    this._tokenType = value;
  }

  set expiresIn(value: number | undefined) {
    this._expiresIn = value;
    if (value) {
      this._tokenExpiresAt = new Date(Date.now() + value * 1000);
    }
  }

  set scope(value: string | undefined) {
    this._scope = value;
  }

  set webhookUrl(value: string) {
    this._webhookUrl = value;
  }

  // ============================================================================
  // MÉTODOS DE VALIDAÇÃO
  // ============================================================================

  isTokenValid(): boolean {
    if (!this._accessToken) {
      return false;
    }

    if (this._tokenExpiresAt) {
      return new Date() < this._tokenExpiresAt;
    }

    return true;
  }

  isTokenExpired(): boolean {
    if (!this._tokenExpiresAt) {
      return false;
    }
    return new Date() >= this._tokenExpiresAt;
  }

  needsTokenRefresh(): boolean {
    if (!this._refreshToken) {
      return false;
    }

    // Considera necessário refresh se expira em menos de 5 minutos
    if (this._tokenExpiresAt) {
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      return this._tokenExpiresAt <= fiveMinutesFromNow;
    }

    return false;
  }

  hasValidConfiguration(): boolean {
    return !!(
      this._clientId &&
      this._clientSecret &&
      this._redirectUri &&
      this._userMarketplaceId
    );
  }

  // ============================================================================
  // MÉTODOS DE ATUALIZAÇÃO DE TOKENS
  // ============================================================================

  updateTokens(
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number,
    tokenType?: string
  ): void {
    this._accessToken = accessToken;
    if (refreshToken) {
      this._refreshToken = refreshToken;
    }
    if (expiresIn) {
      this._expiresIn = expiresIn;
      this._tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
    }
    if (tokenType) {
      this._tokenType = tokenType;
    }
    this._lastTokenRefresh = new Date();
    this._isAuthenticated = true;
  }

  clearTokens(): void {
    this._accessToken = undefined;
    this._refreshToken = undefined;
    this._tokenExpiresAt = undefined;
    this._isAuthenticated = false;
  }

  // ============================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // ============================================================================

  incrementApiCalls(): void {
    this._totalApiCalls++;
    this._lastApiCall = new Date();
  }

  incrementErrors(): void {
    this._totalErrors++;
  }

  // ============================================================================
  // MÉTODOS DE CONFIGURAÇÃO
  // ============================================================================

  updateOperationalConfig(config: {
    timeoutMs?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    apiDelayMs?: number;
    queueConcurrent?: number;
    queueRetryDelay?: number;
    maxTentativas?: number;
  }): void {
    if (config.timeoutMs !== undefined) {
      this._timeoutMs = config.timeoutMs;
    }
    if (config.maxRetries !== undefined) {
      this._maxRetries = config.maxRetries;
    }
    if (config.retryDelayMs !== undefined) {
      this._retryDelayMs = config.retryDelayMs;
    }
    if (config.apiDelayMs !== undefined) {
      this._apiDelayMs = config.apiDelayMs;
    }
    if (config.queueConcurrent !== undefined) {
      this._queueConcurrent = config.queueConcurrent;
    }
    if (config.queueRetryDelay !== undefined) {
      this._queueRetryDelay = config.queueRetryDelay;
    }
    if (config.maxTentativas !== undefined) {
      this._maxTentativas = config.maxTentativas;
    }
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  /**
   * Cria uma instância a partir do ambiente (substitui MercadoLivreApp.fromEnv)
   */
  static fromEnv(
    userMarketplaceId: string,
    nome: string,
    options?: {
      id?: string;
      userId?: string;
      applicationId?: string;
      status?: boolean;
      createdIn?: Date;
      accessToken?: string;
      refreshToken?: string;
      tokenType?: string;
      expiresIn?: number;
      scope?: string;
    }
  ): MercadoLivre {
    const clientId = process.env.CLIENT_KEY_ML;
    const clientSecret = process.env.CLIENT_SECRET_ML;
    const redirectUri = process.env.REDIRECT_URL_ML;
    const webhookUrl = process.env.WEBHOOK_URL_ML ?? '';
    const appName = process.env.NAME_APP_ML ?? 'Marketplace Boilerplate';

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'Configuração Mercado Livre incompleta. Defina CLIENT_KEY_ML, CLIENT_SECRET_ML e REDIRECT_URL_ML.'
      );
    }

    const timeoutMs = parseInt(process.env.API_TIMEOUT || '10000', 10);
    const maxRetries = parseInt(process.env.API_MAX_RETRIES || '3', 10);
    const retryDelayMs = parseInt(process.env.API_RETRY_DELAY || '2000', 10);
    const apiDelayMs = parseInt(process.env.API_DELAY || '200', 10);
    const queueConcurrent = parseInt(process.env.QUEUE_CONCURRENT || '1', 10);
    const queueRetryDelay = parseInt(process.env.QUEUE_RETRY_DELAY || '5000', 10);
    const maxTentativas = parseInt(process.env.API_MAX_RETRIES || '3', 10);

    return new MercadoLivre(
      userMarketplaceId,
      nome,
      clientId,
      clientSecret,
      redirectUri,
      webhookUrl,
      appName,
      {
        ...options,
        timeoutMs,
        maxRetries,
        retryDelayMs,
        apiDelayMs,
        queueConcurrent,
        queueRetryDelay,
        maxTentativas,
      }
    );
  }

  /**
   * Cria uma instância apenas com configurações do app (compatibilidade com MercadoLivreApp)
   * Para uso quando não há userMarketplace ainda
   */
  static createAppConfig(): Omit<MercadoLivre, 'userMarketplaceId' | 'nome'> & {
    userMarketplaceId: string;
    nome: string;
  } {
    const clientId = process.env.CLIENT_KEY_ML;
    const clientSecret = process.env.CLIENT_SECRET_ML;
    const redirectUri = process.env.REDIRECT_URL_ML;
    const webhookUrl = process.env.WEBHOOK_URL_ML ?? '';
    const appName = process.env.NAME_APP_ML ?? 'Marketplace Boilerplate';

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'Configuração Mercado Livre incompleta. Defina CLIENT_KEY_ML, CLIENT_SECRET_ML e REDIRECT_URL_ML.'
      );
    }

    const timeoutMs = parseInt(process.env.API_TIMEOUT || '10000', 10);
    const maxRetries = parseInt(process.env.API_MAX_RETRIES || '3', 10);
    const retryDelayMs = parseInt(process.env.API_RETRY_DELAY || '2000', 10);

    // Retorna um objeto compatível com MercadoLivreApp
    return {
      userMarketplaceId: '',
      nome: '',
      clientId,
      clientSecret,
      redirectUri,
      webhookUrl,
      appName,
      name: appName,
      timeoutMs,
      maxRetries,
      retryDelayMs,
      apiDelayMs: parseInt(process.env.API_DELAY || '200', 10),
      queueConcurrent: parseInt(process.env.QUEUE_CONCURRENT || '1', 10),
      queueRetryDelay: parseInt(process.env.QUEUE_RETRY_DELAY || '5000', 10),
      maxTentativas: parseInt(process.env.API_MAX_RETRIES || '3', 10),
    } as any;
  }

  // ============================================================================
  // MÉTODOS DE SERIALIZAÇÃO
  // ============================================================================

  toJSON(): Record<string, any> {
    return {
      id: this._id,
      userMarketplaceId: this._userMarketplaceId,
      userId: this._userId,
      applicationId: this._applicationId,
      nome: this._nome,
      status: this._status,
      createdIn: this._createdIn?.toISOString(),
      isAuthenticated: this._isAuthenticated,
      tokenExpiresAt: this._tokenExpiresAt?.toISOString(),
      isTokenValid: this.isTokenValid(),
      needsTokenRefresh: this.needsTokenRefresh(),
      appName: this._appName,
      webhookUrl: this._webhookUrl,
      lastTokenRefresh: this._lastTokenRefresh?.toISOString(),
      lastApiCall: this._lastApiCall?.toISOString(),
      totalApiCalls: this._totalApiCalls,
      totalErrors: this._totalErrors,
      // Não incluir tokens por segurança
    };
  }
}

// ============================================================================
// ALIAS PARA COMPATIBILIDADE (substitui MercadoLivreApp)
// ============================================================================

/**
 * @deprecated Use MercadoLivre.createAppConfig() ou MercadoLivre.fromEnv() diretamente
 * Mantido apenas para compatibilidade durante migração
 */
export type MercadoLivreApp = Pick<
  MercadoLivre,
  | 'name'
  | 'clientId'
  | 'clientSecret'
  | 'redirectUri'
  | 'webhookUrl'
  | 'timeoutMs'
  | 'maxRetries'
  | 'retryDelayMs'
>;
