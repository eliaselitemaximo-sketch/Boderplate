export class AuthMercadoLivre {
  private _userMarketplaceId: string;
  private _userId?: string;
  private _scope?: string;

  constructor(userMarketplaceId: string, userId?: string, scope?: string) {
    this._userMarketplaceId = userMarketplaceId;
    this._userId = userId;
    this._scope = scope;
  }

  get userMarketplaceId(): string {
    return this._userMarketplaceId;
  }

  set userMarketplaceId(value: string) {
    this._userMarketplaceId = value;
  }

  get userId(): string | undefined {
    return this._userId;
  }

  set userId(value: string | undefined) {
    this._userId = value;
  }

  get scope(): string | undefined {
    return this._scope;
  }

  set scope(value: string | undefined) {
    this._scope = value;
  }
}
