import { WebhookLogRepository } from '../repositories/WebhookLogRepository';
import { WebhookLog } from '../entities/WebhookLog';
import { WebhookLogResponseDTO } from '../dtos/WebhookLogDTO';

export class WebhookService {
    private webhookLogRepository: WebhookLogRepository;

    constructor() {
        this.webhookLogRepository = new WebhookLogRepository();
    }

    async handleWebhook(webhookData: any): Promise<WebhookLogResponseDTO> {
        const webhookLog = new WebhookLog(webhookData);
        const created = await this.webhookLogRepository.create(webhookLog);
        return {
            id: created.id!,
            createdAt: created.createdAt,
            request: created.request,
        };
    }

    async getAllWebhookLogs(): Promise<WebhookLogResponseDTO[]> {
        const logs = await this.webhookLogRepository.findAll();
        return logs.map(log => ({
            id: log.id!,
            createdAt: log.createdAt,
            request: log.request,
        }));
    }
}
