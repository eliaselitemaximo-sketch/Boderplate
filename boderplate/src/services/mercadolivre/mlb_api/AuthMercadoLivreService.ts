import axios from 'axios';
import { AuthMercadoLivre } from '../../../entities/AuthMercadoLivre';
import { AuthMercadoLivreRepository } from '../../../repositories/mercadolivre/AuthMercadoLivreRepository';
import { UserMarketplaceRepository } from '../../../repositories/UserMarketplaceRepository';
import { AuthURLResponseDTO, TokenResponseDTO } from '../../../dtos/AuthMarketplaceDTO';
import { AuthStateService } from '../../AuthStateService';
import { MercadoLivre } from '../../../entities/MercadoLivre';

export class AuthMercadoLivreService {
  private authRepository: AuthMercadoLivreRepository;
  private userMarketplaceRepository: UserMarketplaceRepository;
  private stateService: AuthStateService;
  private readonly authBaseUrl = 'https://auth.mercadolivre.com.br/authorization';
  private readonly app: MercadoLivre;

  constructor(
    stateService: AuthStateService = new AuthStateService('mercadolivre'),
    app: MercadoLivre = MercadoLivre.createAppConfig() as MercadoLivre
  ) {
    this.authRepository = new AuthMercadoLivreRepository();
    this.userMarketplaceRepository = new UserMarketplaceRepository();
    this.stateService = stateService;
    this.app = app;
  }

  async createAuthorizationURL(userMarketplaceId: string): Promise<AuthURLResponseDTO> {
    const clientId = this.app.clientId;
    const redirectUri = this.app.redirectUri;
    const state = this.stateService.generateState(userMarketplaceId);

    const queryParams: string[] = [
      'response_type=code',
      `client_id=${encodeURIComponent(clientId)}`,
      `redirect_uri=${redirectUri}`,
    ];

    if (state) {
      queryParams.push(`state=${encodeURIComponent(state)}`);
    }

    const authUrl = `${this.authBaseUrl}?${queryParams.join('&')}`;

    return {
      authUrl,
      userMarketplaceId,
    };
  }

  async exchangeCodeForToken(code: string, state: string): Promise<TokenResponseDTO> {
    const clientId = this.app.clientId;
    const clientSecret = this.app.clientSecret;
    const redirectUri = this.app.redirectUri;
    const userMarketplaceId = this.stateService.consumeState(state, code);

    const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
    });

    const { access_token, refresh_token, expires_in, token_type, user_id, scope } = response.data;

    const userMarketplace = await this.userMarketplaceRepository.findById(userMarketplaceId);
    if (!userMarketplace) {
      throw new Error('User marketplace not found');
    }

    await this.userMarketplaceRepository.update(userMarketplaceId, {
      accessToken: access_token,
      refreshToken: refresh_token,
    });

    const authEntity = new AuthMercadoLivre(userMarketplaceId, user_id, scope);
    await this.authRepository.create(authEntity);

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      tokenType: token_type,
    };
  }

  async refreshAccessToken(userMarketplaceId: string): Promise<TokenResponseDTO> {
    const userMarketplace = await this.userMarketplaceRepository.findById(userMarketplaceId);
    if (!userMarketplace || !userMarketplace.refreshToken) {
      throw new Error('User marketplace not found or refresh token not available');
    }

    const clientId = this.app.clientId;
    const clientSecret = this.app.clientSecret;

    const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: userMarketplace.refreshToken,
    });

    const { access_token, refresh_token, expires_in, token_type } = response.data;

    await this.userMarketplaceRepository.update(userMarketplaceId, {
      accessToken: access_token,
      refreshToken: refresh_token,
    });

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      tokenType: token_type,
    };
  }
}

