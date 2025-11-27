import { redis } from '../../infra/cache/redis';
import { WebhookNotification } from '../../entities/WebhookNotification';
import { randomUUID } from 'crypto';

const NOTIFICATION_INDEX_KEY = 'mlb:webhook:notifications:index';
const NOTIFICATION_ITEM_PREFIX = 'mlb:webhook:notifications:item:';

interface StoredNotification {
  id: string;
  notificationId: string;
  resource?: string;
  userId?: string;
  topic?: string;
  applicationId?: string;
  attempts?: number;
  sentAt?: string;
  receivedAt?: string;
  requestData?: string;
  responseData?: string;
  processed: boolean;
  processedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export class WebhookNotificationRepository {
  private buildKey(notificationId: string) {
    return `${NOTIFICATION_ITEM_PREFIX}${notificationId}`;
  }

  private toStored(entity: WebhookNotification): StoredNotification {
    const now = new Date();
    const receivedAt = entity.receivedAt ?? now;
    const createdAt = entity.processedAt ?? entity.sentAt ?? entity.receivedAt ?? now;

    return {
      id: entity.id || entity.notificationId || randomUUID(),
      notificationId: entity.notificationId || entity.id || randomUUID(),
      resource: entity.resource,
      userId: entity.userId,
      topic: entity.topic,
      applicationId: entity.applicationId,
      attempts: entity.attempts ? Number(entity.attempts) : 0,
      sentAt: entity.sentAt ? entity.sentAt.toISOString() : undefined,
      receivedAt: receivedAt.toISOString(),
      requestData: entity.requestData ? JSON.stringify(entity.requestData) : undefined,
      responseData: entity.responseData ? JSON.stringify(entity.responseData) : undefined,
      processed: entity.processed ?? false,
      processedAt: entity.processedAt ? entity.processedAt.toISOString() : undefined,
      errorMessage: entity.errorMessage,
      createdAt: entity.sentAt ? entity.sentAt.toISOString() : createdAt.toISOString(),
      updatedAt: entity.updatedAt ? entity.updatedAt.toISOString() : now.toISOString(),
    };
  }

  private fromStored(record: StoredNotification | null): WebhookNotification | null {
    if (!record) {
      return null;
    }

    return new WebhookNotification(
      record.notificationId,
      record.resource,
      record.userId,
      record.topic,
      record.applicationId,
      record.attempts?.toString(),
      record.sentAt ? new Date(record.sentAt) : undefined,
      record.receivedAt ? new Date(record.receivedAt) : undefined,
      record.requestData ? JSON.parse(record.requestData) : undefined,
      record.responseData ? JSON.parse(record.responseData) : undefined,
      record.processed,
      record.processedAt ? new Date(record.processedAt) : undefined,
      record.errorMessage,
      record.id,
      record.updatedAt ? new Date(record.updatedAt) : undefined
    );
  }

  private async fetchStored(notificationId: string): Promise<StoredNotification | null> {
    const raw = await redis.get(this.buildKey(notificationId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  }

  private async saveStored(record: StoredNotification): Promise<void> {
    await redis.set(this.buildKey(record.notificationId), JSON.stringify(record));
    const score = record.receivedAt ? new Date(record.receivedAt).getTime() : Date.now();
    await redis.zadd(NOTIFICATION_INDEX_KEY, score, record.notificationId);
  }

  async create(entity: WebhookNotification): Promise<WebhookNotification> {
    const record = this.toStored(entity);

    const existing = await this.fetchStored(record.notificationId);
    if (existing) {
      record.id = existing.id;
      record.createdAt = existing.createdAt;
      record.attempts = record.attempts ?? existing.attempts;
      record.requestData = record.requestData ?? existing.requestData;
      record.receivedAt = record.receivedAt ?? existing.receivedAt;
    }

    await this.saveStored(record);
    return this.fromStored(record)!;
  }

  async findById(id: string): Promise<WebhookNotification | null> {
    return this.findByNotificationId(id);
  }

  async findByNotificationId(notificationId: string): Promise<WebhookNotification | null> {
    const record = await this.fetchStored(notificationId);
    return this.fromStored(record);
  }

  async findUnprocessed(limit: number = 100): Promise<WebhookNotification[]> {
    const ids = await redis.zrevrange(NOTIFICATION_INDEX_KEY, 0, -1);
    const results: WebhookNotification[] = [];

    for (const id of ids) {
      if (results.length >= limit) {
        break;
      }
      const record = await this.fetchStored(id);
      const entity = this.fromStored(record);
      if (entity && !entity.processed && entity.topic === 'orders') {
        results.push(entity);
      }
    }

    return results;
  }

  async update(id: string, entity: Partial<WebhookNotification>): Promise<WebhookNotification | null> {
    const existing = await this.findByNotificationId(id);
    if (!existing) {
      return null;
    }
    return this.updateByNotificationId(existing.notificationId!, entity);
  }

  async updateByNotificationId(
    notificationId: string,
    entity: Partial<WebhookNotification>
  ): Promise<WebhookNotification | null> {
    const record = await this.fetchStored(notificationId);
    if (!record) {
      return null;
    }

    if (entity.processed !== undefined) {
      record.processed = entity.processed;
    }
    if (entity.processedAt !== undefined) {
      record.processedAt = entity.processedAt ? entity.processedAt.toISOString() : undefined;
    }
    if (entity.errorMessage !== undefined) {
      record.errorMessage = entity.errorMessage;
    }
    if (entity.responseData !== undefined) {
      record.responseData = entity.responseData ? JSON.stringify(entity.responseData) : undefined;
    }
    if (entity.attempts !== undefined) {
      record.attempts = entity.attempts ? Number(entity.attempts) : 0;
    }

    record.updatedAt = new Date().toISOString();
    await this.saveStored(record);
    return this.fromStored(record);
  }

  async findAll(
    limit: number = 50,
    offset: number = 0,
    filters?: { processed?: boolean; topic?: string }
  ): Promise<{ data: WebhookNotification[]; total: number }> {
    const ids = await redis.zrevrange(NOTIFICATION_INDEX_KEY, 0, -1);
    const entities: WebhookNotification[] = [];

    for (const id of ids) {
      const entity = await this.findByNotificationId(id);
      if (!entity) continue;

      if (filters?.processed !== undefined && entity.processed !== filters.processed) {
        continue;
      }

      if (filters?.topic && entity.topic !== filters.topic) {
        continue;
      }

      entities.push(entity);
    }

    const total = entities.length;
    const paginated = entities.slice(offset, offset + limit);
    return { data: paginated, total };
  }

  async getStatistics(): Promise<{
    total: number;
    processed: number;
    unprocessed: number;
    withError: number;
    byTopic: Array<{ topic: string; count: number }>;
    last24Hours: number;
  }> {
    const ids = await redis.zrange(NOTIFICATION_INDEX_KEY, 0, -1);
    const records: WebhookNotification[] = [];

    for (const id of ids) {
      const entity = await this.findByNotificationId(id);
      if (entity) {
        records.push(entity);
      }
    }

    const total = records.length;
    const processed = records.filter((n) => n.processed).length;
    const unprocessed = records.filter((n) => !n.processed).length;
    const withError = records.filter((n) => !!n.errorMessage).length;
    const last24HoursThreshold = Date.now() - 24 * 60 * 60 * 1000;
    const last24Hours = records.filter(
      (n) => n.receivedAt && n.receivedAt.getTime() >= last24HoursThreshold
    ).length;

    const topicCounts = records.reduce<Record<string, number>>((acc, curr) => {
      const topic = curr.topic || 'unknown';
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {});

    const byTopic = Object.entries(topicCounts).map(([topic, count]) => ({
      topic,
      count,
    }));

    return {
      total,
      processed,
      unprocessed,
      withError,
      byTopic,
      last24Hours,
    };
  }
}

