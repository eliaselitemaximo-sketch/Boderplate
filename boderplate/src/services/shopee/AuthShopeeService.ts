import axios from 'axios';
import crypto from 'crypto';
import { AuthShopee } from '../../entities/AuthShopee';
import { AuthShopeeRepository } from '../../repositories/shopee/AuthShopeeRepository';
import { UserMarketplaceRepository } from '../../repositories/UserMarketplaceRepository';
import { AuthURLResponseDTO, TokenResponseDTO } from '../../dtos/AuthMarketplaceDTO';

export class AuthShopeeService {
  private authRepository: AuthShopeeRepository;
  private userMarketplaceRepository: UserMarketplaceRepository;
  private readonly baseUrl = 'https://partner.shopeemobile.com';

  constructor() {
    this.authRepository = new AuthShopeeRepository();
    this.userMarketplaceRepository = new UserMarketplaceRepository();
  }

  private generateSign(path: string, timestamp: number): string {
    const partnerId = parseInt(process.env.CLIENT_KEY_SH!);
    const partnerKey = process.env.CLIENT_SECRET_SH!;
    const baseString = `${partnerId}${path}${timestamp}`;
    return crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');
  }

  async createAuthorizationURL(userMarketplaceId: string): Promise<AuthURLResponseDTO> {
    const partnerId = process.env.CLIENT_KEY_SH!;
    const redirectUrl = process.env.REDIRECT_URL_SH!;
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const sign = this.generateSign(path, timestamp);

    const redirectWithState = new URL(redirectUrl);
    redirectWithState.searchParams.set('state', userMarketplaceId);

    const authUrl =
      `${this.baseUrl}${path}?` +
      `partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(
        redirectWithState.toString()
      )}`;

    return {
      authUrl,
      userMarketplaceId,
    };
  }

  async exchangeCodeForToken(code: string, shopId: string, userMarketplaceId: string): Promise<TokenResponseDTO> {
    const partnerId = parseInt(process.env.CLIENT_KEY_SH!);
    const partnerKey = process.env.CLIENT_SECRET_SH!;
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/token/get';
    const sign = this.generateSign(path, timestamp);

    const response = await axios.post(
      `${this.baseUrl}${path}`,
      {
        code,
        shop_id: parseInt(shopId),
        partner_id: partnerId,
      },
      {
        params: {
          partner_id: partnerId,
          timestamp,
          sign,
        },
      }
    );

    const { access_token, refresh_token, expire_in } = response.data;

    const userMarketplace = await this.userMarketplaceRepository.findById(userMarketplaceId);
    if (!userMarketplace) {
      throw new Error('User marketplace not found');
    }

    await this.userMarketplaceRepository.update(userMarketplaceId, {
      accessToken: access_token,
      refreshToken: refresh_token,
    });

    const authEntity = new AuthShopee(userMarketplaceId, shopId);
    await this.authRepository.create(authEntity);

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expire_in,
    };
  }

  async refreshAccessToken(userMarketplaceId: string): Promise<TokenResponseDTO> {
    const userMarketplace = await this.userMarketplaceRepository.findById(userMarketplaceId);
    const authShopee = await this.authRepository.findByUserMarketplaceId(userMarketplaceId);

    if (!userMarketplace || !userMarketplace.refreshToken || !authShopee?.shopId) {
      throw new Error('User marketplace not found or refresh token not available');
    }

    const partnerId = parseInt(process.env.CLIENT_KEY_SH!);
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/access_token/get';
    const sign = this.generateSign(path, timestamp);

    const response = await axios.post(
      `${this.baseUrl}${path}`,
      {
        refresh_token: userMarketplace.refreshToken,
        shop_id: parseInt(authShopee.shopId),
        partner_id: partnerId,
      },
      {
        params: {
          partner_id: partnerId,
          timestamp,
          sign,
        },
      }
    );

    const { access_token, refresh_token, expire_in } = response.data;

    await this.userMarketplaceRepository.update(userMarketplaceId, {
      accessToken: access_token,
      refreshToken: refresh_token,
    });

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expire_in,
    };
  }
}
