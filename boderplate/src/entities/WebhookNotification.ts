export class WebhookNotification {
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
    this._receivedAt = receivedAt;
    this._requestData = requestData;
    this._responseData = responseData;
    this._processed = processed;
    this._processedAt = processedAt;
    this._errorMessage = errorMessage;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined {
    return this._id;
  }

  set id(value: string | undefined) {
    this._id = value;
  }

  get notificationId(): string | undefined {
    return this._notificationId;
  }

  set notificationId(value: string | undefined) {
    this._notificationId = value;
  }

  get resource(): string | undefined {
    return this._resource;
  }

  set resource(value: string | undefined) {
    this._resource = value;
  }

  get userId(): string | undefined {
    return this._userId;
  }

  set userId(value: string | undefined) {
    this._userId = value;
  }

  get topic(): string | undefined {
    return this._topic;
  }

  set topic(value: string | undefined) {
    this._topic = value;
  }

  get applicationId(): string | undefined {
    return this._applicationId;
  }

  set applicationId(value: string | undefined) {
    this._applicationId = value;
  }

  get attempts(): string | undefined {
    return this._attempts;
  }

  set attempts(value: string | undefined) {
    this._attempts = value;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  set sentAt(value: Date | undefined) {
    this._sentAt = value;
  }

  get receivedAt(): Date | undefined {
    return this._receivedAt;
  }

  set receivedAt(value: Date | undefined) {
    this._receivedAt = value;
  }

  get requestData(): any {
    return this._requestData;
  }

  set requestData(value: any) {
    this._requestData = value;
  }

  get responseData(): any {
    return this._responseData;
  }

  set responseData(value: any) {
    this._responseData = value;
  }

  get processed(): boolean {
    return this._processed;
  }

  set processed(value: boolean) {
    this._processed = value;
  }

  get processedAt(): Date | undefined {
    return this._processedAt;
  }

  set processedAt(value: Date | undefined) {
    this._processedAt = value;
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  set errorMessage(value: string | undefined) {
    this._errorMessage = value;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  set updatedAt(value: Date | undefined) {
    this._updatedAt = value;
  }
}

