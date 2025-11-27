export class AuthShopee {
  private _userMarketplaceId: string;
  private _shopId?: string;
  private _mainAccountId?: string;
  private _merchantIdList?: string;
  private _shpIdList?: string;

  constructor(
    userMarketplaceId: string,
    shopId?: string,
    mainAccountId?: string,
    merchantIdList?: string,
    shpIdList?: string
  ) {
    this._userMarketplaceId = userMarketplaceId;
    this._shopId = shopId;
    this._mainAccountId = mainAccountId;
    this._merchantIdList = merchantIdList;
    this._shpIdList = shpIdList;
  }

  get userMarketplaceId(): string {
    return this._userMarketplaceId;
  }

  set userMarketplaceId(value: string) {
    this._userMarketplaceId = value;
  }

  get shopId(): string | undefined {
    return this._shopId;
  }

  set shopId(value: string | undefined) {
    this._shopId = value;
  }

  get mainAccountId(): string | undefined {
    return this._mainAccountId;
  }

  set mainAccountId(value: string | undefined) {
    this._mainAccountId = value;
  }

  get merchantIdList(): string | undefined {
    return this._merchantIdList;
  }

  set merchantIdList(value: string | undefined) {
    this._merchantIdList = value;
  }

  get shpIdList(): string | undefined {
    return this._shpIdList;
  }

  set shpIdList(value: string | undefined) {
    this._shpIdList = value;
  }
}
