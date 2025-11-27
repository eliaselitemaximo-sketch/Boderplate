import axios from 'axios';
import crypto from 'crypto';
import { AuthTikTokShop } from '../../entities/AuthTikTokShop';
import { AuthTikTokShopRepository } from '../../repositories/tiktokshop/AuthTikTokShopRepository';
import { UserMarketplaceRepository } from '../../repositories/UserMarketplaceRepository';
import { AuthURLResponseDTO, TokenResponseDTO } from '../../dtos/AuthMarketplaceDTO';
import { AuthStateService } from '../AuthStateService';

export class AuthTikTokShopService {
  private authRepository: AuthTikTokShopRepository;
  private userMarketplaceRepository: UserMarketplaceRepository;
  private readonly baseUrl = 'https://open-api.tiktokglobalshop.com';
  private stateService: AuthStateService;

  constructor(stateService: AuthStateService = new AuthStateService('tiktokshop')) {
    this.authRepository = new AuthTikTokShopRepository();
    this.userMarketplaceRepository = new UserMarketplaceRepository();
    this.stateService = stateService;
  }

  private generateSign(params: Record<string, any>): string {
    const appSecret = process.env.CLIENT_SECRET_TK!;
    const sortedKeys = Object.keys(params).sort();
    const baseString = sortedKeys.map((key) => `${key}${params[key]}`).join('');
    return crypto
      .createHmac('sha256', appSecret)
      .update(baseString)
      .digest('hex');
  }

  async createAuthorizationURL(userMarketplaceId: string): Promise<AuthURLResponseDTO> {
    const appKey = process.env.CLIENT_KEY_TK!;
    const redirectUri = process.env.REDIRECT_URL_TK!;

    const state = this.stateService.generateState(userMarketplaceId);

    const authUrl =
      `https://services.tiktokshop.com/open/authorize?` +
      `app_key=${appKey}&state=${encodeURIComponent(state)}`;

    return {
      authUrl,
      userMarketplaceId,
    };
  }

  async exchangeCodeForToken(code: string, state: string): Promise<TokenResponseDTO> {
    const appKey = process.env.CLIENT_KEY_TK!;
    const appSecret = process.env.CLIENT_SECRET_TK!;
    const timestamp = Math.floor(Date.now() / 1000);
    const userMarketplaceId = this.stateService.consumeState(state, code);

    const params = {
      app_key: appKey,
      app_secret: appSecret,
      auth_code: code,
      grant_type: 'authorized_code',
      timestamp: timestamp.toString(),
    };

    const sign = this.generateSign(params);

    const response = await axios.get(`${this.baseUrl}/api/token/get`, {
      params: { ...params, sign },
    });

    const { access_token, refresh_token, access_token_expire_in, open_id, seller_name } =
      response.data.data;

    const userMarketplace = await this.userMarketplaceRepository.findById(userMarketplaceId);
    if (!userMarketplace) {
      throw new Error('User marketplace not found');
    }

    await this.userMarketplaceRepository.update(userMarketplaceId, {
      accessToken: access_token,
      refreshToken: refresh_token,
    });

    const authEntity = new AuthTikTokShop(userMarketplaceId, open_id);
    await this.authRepository.create(authEntity);

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: access_token_expire_in,
    };
  }

  async refreshAccessToken(userMarketplaceId: string): Promise<TokenResponseDTO> {
    const userMarketplace = await this.userMarketplaceRepository.findById(userMarketplaceId);
    if (!userMarketplace || !userMarketplace.refreshToken) {
      throw new Error('User marketplace not found or refresh token not available');
    }

    const appKey = process.env.CLIENT_KEY_TK!;
    const appSecret = process.env.CLIENT_SECRET_TK!;
    const timestamp = Math.floor(Date.now() / 1000);

    const params = {
      app_key: appKey,
      app_secret: appSecret,
      refresh_token: userMarketplace.refreshToken,
      grant_type: 'refresh_token',
      timestamp: timestamp.toString(),
    };

    const sign = this.generateSign(params);

    const response = await axios.get(`${this.baseUrl}/api/token/refresh`, {
      params: { ...params, sign },
    });

    const { access_token, refresh_token, access_token_expire_in } = response.data.data;

    await this.userMarketplaceRepository.update(userMarketplaceId, {
      accessToken: access_token,
      refreshToken: refresh_token,
    });

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: access_token_expire_in,
    };
  }
}
