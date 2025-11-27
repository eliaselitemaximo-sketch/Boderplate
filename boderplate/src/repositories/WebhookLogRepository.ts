import { redis } from '../infra/cache/redis';
import { WebhookLog } from '../entities/WebhookLog';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_LOGS_KEY = 'webhook:logs';

// Tempo de expiração dos logs no Redis (em segundos)
// Configurado via variável de ambiente WEBHOOK_LOGS_TTL
// Padrão: 7 dias (604800 segundos)
const WEBHOOK_LOGS_TTL = parseInt(process.env.WEBHOOK_LOGS_TTL || '604800', 10);

// Número máximo de logs armazenados no Redis
// Configurado via variável de ambiente MAX_WEBHOOK_LOGS
// Padrão: 1000 registros
const MAX_WEBHOOK_LOGS = parseInt(process.env.MAX_WEBHOOK_LOGS || '90000', 10);

export class WebhookLogRepository {
    async create(webhookLog: WebhookLog): Promise<WebhookLog> {
        const id = randomUUID();
        const createdAt = new Date();

        const logData = {
            id,
            createdAt: createdAt.toISOString(),
            request: webhookLog.request,
        };

        // Armazena no Redis sorted set com timestamp como score para ordenação cronológica
        await redis.zadd(
            WEBHOOK_LOGS_KEY,
            createdAt.getTime(),
            JSON.stringify(logData)
        );

        // Define o tempo de expiração da chave (TTL)
        await redis.expire(WEBHOOK_LOGS_KEY, WEBHOOK_LOGS_TTL);

        // Limita o número de registros mantendo apenas os MAX_WEBHOOK_LOGS mais recentes
        // Remove os logs mais antigos se exceder o limite
        const totalLogs = await redis.zcard(WEBHOOK_LOGS_KEY);
        if (totalLogs > MAX_WEBHOOK_LOGS) {
            // Remove os logs mais antigos (mantém apenas os últimos MAX_WEBHOOK_LOGS)
            await redis.zremrangebyrank(WEBHOOK_LOGS_KEY, 0, totalLogs - MAX_WEBHOOK_LOGS - 1);
        }

        const entity = new WebhookLog(webhookLog.request);
        entity.id = id;
        entity.createdAt = createdAt;
        return entity;
    }

    async findAll(): Promise<WebhookLog[]> {
        // Busca todos os logs ordenados por timestamp (do mais antigo ao mais recente)
        const results = await redis.zrange(WEBHOOK_LOGS_KEY, 0, -1);

        return results.map((jsonStr: string) => {
            const data = JSON.parse(jsonStr);
            return this.mapToEntity(data);
        });
    }

    private mapToEntity(fields: any): WebhookLog {
        const entity = new WebhookLog(fields.request);
        entity.id = fields.id;
        entity.createdAt = new Date(fields.createdAt);
        return entity;
    }
}
