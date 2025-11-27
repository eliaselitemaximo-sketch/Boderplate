export class UserMarketplace {
  private _id?: string;
  private _nome: string;
  private _type: string;
  private _createdIn?: Date;
  private _status: boolean;
  private _accessToken?: string;
  private _refreshToken?: string;

  constructor(
    nome: string,
    type: string,
    status: boolean = true,
    id?: string,
    createdIn?: Date,
    accessToken?: string,
    refreshToken?: string
  ) {
    this._nome = nome;
    this._type = type;
    this._status = status;
    this._id = id;
    this._createdIn = createdIn;
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;
  }

  get id(): string | undefined {
    return this._id;
  }

  set id(value: string | undefined) {
    this._id = value;
  }

  get nome(): string {
    return this._nome;
  }

  set nome(value: string) {
    this._nome = value;
  }

  get type(): string {
    return this._type;
  }

  set type(value: string) {
    this._type = value;
  }

  get createdIn(): Date | undefined {
    return this._createdIn;
  }

  set createdIn(value: Date | undefined) {
    this._createdIn = value;
  }

  get status(): boolean {
    return this._status;
  }

  set status(value: boolean) {
    this._status = value;
  }

  get accessToken(): string | undefined {
    return this._accessToken;
  }

  set accessToken(value: string | undefined) {
    this._accessToken = value;
  }

  get refreshToken(): string | undefined {
    return this._refreshToken;
  }

  set refreshToken(value: string | undefined) {
    this._refreshToken = value;
  }
}
