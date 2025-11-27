export interface CreateUserMarketplaceDTO {
  nome: string;
  type: 'ml' | 'sh' | 'tk';
}

export interface UpdateUserMarketplaceDTO {
  nome?: string;
  type?: 'ml' | 'sh' | 'tk';
  status?: boolean;
  accessToken?: string;
  refreshToken?: string;
}

export interface UserMarketplaceResponseDTO {
  id: string;
  nome: string;
  type: string;
  createdIn?: Date;
  status: boolean;
  accessToken?: string;
  refreshToken?: string;
}
