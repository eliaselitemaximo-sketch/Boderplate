export interface AuthURLResponseDTO {
  authUrl: string;
  userMarketplaceId: string;
}

export interface TokenResponseDTO {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface RefreshTokenRequestDTO {
  userMarketplaceId: string;
}
