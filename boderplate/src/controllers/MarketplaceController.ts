import { Response } from 'express';
import { MarketplaceService } from '../services/MarketplaceService';
import { AuthRequest } from '../middleware/authMiddleware';
import logger from '../infra/logs/logger';

export class MarketplaceController {
  private service: MarketplaceService;

  constructor() {
    this.service = new MarketplaceService();
  }

  public getCredentials = async (req: AuthRequest, res: Response) => {
    try {
      const credentials = this.service.getCredentials();
      logger.info({
        context: 'MarketplaceController',
        action: 'getCredentials',
        route: req.originalUrl,
        method: req.method,
        status: 200,
        response: credentials
      });
      res.json(credentials);
    } catch (error) {
      const response = { error: 'Internal server error' };
      logger.error({
        context: 'MarketplaceController',
        action: 'getCredentials',
        route: req.originalUrl,
        method: req.method,
        status: 500,
        response,
        error
      });
      res.status(500).json(response);
    }
  };

  public getWebhookConfig = async (req: AuthRequest, res: Response) => {
    try {
      const webhookConfig = this.service.getWebhookConfig();
      logger.info({
        context: 'MarketplaceController',
        action: 'getWebhookConfig',
        route: req.originalUrl,
        method: req.method,
        status: 200,
        response: webhookConfig
      });
      res.json(webhookConfig);
    } catch (error) {
      const response = { error: 'Internal server error' };
      logger.error({
        context: 'MarketplaceController',
        action: 'getWebhookConfig',
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
