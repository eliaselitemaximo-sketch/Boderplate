import { Request, Response } from 'express';
import { WebhookService } from '../services/WebhookService';
import logger from '../infra/logs/logger';

export class WebhookController {
    private service: WebhookService;

    constructor() {
        this.service = new WebhookService();
    }

    public handleWebhook = async (req: Request, res: Response) => {
        // Log da entrada da requisição para debug detalhado
        logger.info({
            context: 'WebhookController',
            action: 'handleWebhook',
            message: 'Recebendo webhook',
            headers: req.headers,
            body: req.body
        });

        try {
            const webhookData = req.body;

            // Validação básica
            if (!webhookData || Object.keys(webhookData).length === 0) {
                logger.warn({
                    context: 'WebhookController',
                    action: 'handleWebhook',
                    message: 'Webhook recebido sem corpo (body empty)'
                });
            }

            const result = await this.service.handleWebhook(webhookData);

            logger.info({
                context: 'WebhookController',
                action: 'handleWebhook',
                route: req.originalUrl,
                method: req.method,
                status: 200,
                response: result
            });

            // Resposta rápida e simples conforme esperado por webhooks
            res.status(200).json({
                status: 'OK'
            });
        } catch (error) {
            const response = { error: 'Internal server error' };
            logger.error({
                context: 'WebhookController',
                action: 'handleWebhook',
                route: req.originalUrl,
                method: req.method,
                status: 500,
                response,
                error
            });
            res.status(500).json(response);
        }
    };

    public getAllWebhookLogs = async (req: Request, res: Response) => {
        try {
            const logs = await this.service.getAllWebhookLogs();

            logger.info({
                context: 'WebhookController',
                action: 'getAllWebhookLogs',
                route: req.originalUrl,
                method: req.method,
                status: 200,
                response: { count: logs.length }
            });

            res.status(200).json(logs);
        } catch (error) {
            const response = { error: 'Internal server error' };
            logger.error({
                context: 'WebhookController',
                action: 'getAllWebhookLogs',
                route: req.originalUrl,
                method: req.method,
                status: 500,
                response,
                error
            });
            res.status(500).json(response);
        }
    };
}
