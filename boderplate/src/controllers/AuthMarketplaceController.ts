import { Request, Response } from 'express';
import { AuthMercadoLivreService } from '../services/mercadolivre/AuthMercadoLivreService';
import { AuthShopeeService } from '../services/shopee/AuthShopeeService';
import { AuthTikTokShopService } from '../services/tiktokshop/AuthTikTokShopService';
import { AuthRequest } from '../middleware/authMiddleware';
import { validationResult } from 'express-validator';
import { UserMarketplaceService } from '../services/UserMarketplaceService';
import logger from '../infra/logs/logger';

export class AuthMarketplaceController {
  private mercadoLivreService: AuthMercadoLivreService;
  private shopeeService: AuthShopeeService;
  private tiktokshopService: AuthTikTokShopService;
  private userMarketplaceService: UserMarketplaceService;

  constructor() {
    this.mercadoLivreService = new AuthMercadoLivreService();
    this.shopeeService = new AuthShopeeService();
    this.tiktokshopService = new AuthTikTokShopService();
    this.userMarketplaceService = new UserMarketplaceService();
  }

  private handleError(req: Request, res: Response, error: any, defaultMessage: string = 'Internal server error') {
    const response = { error: error?.message || defaultMessage };
    logger.error({
      context: 'AuthMarketplaceController',
      action: 'Error',
      route: req.originalUrl,
      method: req.method,
      status: 500,
      response,
      error
    });
    res.status(500).json(response);
  }

  public createAuthorizationURL = async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response = { errors: errors.array() };
        logger.info({
          context: 'AuthMarketplaceController',
          action: 'createAuthorizationURL',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }

      const userMarketplaceId = req.params.id;
      const userMarketplace = await this.userMarketplaceService.findById(userMarketplaceId);

      if (!userMarketplace) {
        const response = { error: 'User marketplace not found' };
        logger.info({
          context: 'AuthMarketplaceController',
          action: 'createAuthorizationURL',
          route: req.originalUrl,
          method: req.method,
          status: 404,
          response
        });
        return res.status(404).json(response);
      }

      let result;
      switch (userMarketplace.type) {
        case 'ml': {
          result = await this.mercadoLivreService.createAuthorizationURL(userMarketplaceId);
          break;
        }
        case 'sh': {
          result = await this.shopeeService.createAuthorizationURL(userMarketplaceId);
          break;
        }
        case 'tk': {
          result = await this.tiktokshopService.createAuthorizationURL(userMarketplaceId);
          break;
        }
        default:
          const response = { error: 'Unsupported marketplace type' };
          logger.info({
            context: 'AuthMarketplaceController',
            action: 'createAuthorizationURL',
            route: req.originalUrl,
            method: req.method,
            status: 400,
            response
          });
          return res.status(400).json(response);
      }

      logger.info({
        context: 'AuthMarketplaceController',
        action: 'createAuthorizationURL',
        route: req.originalUrl,
        method: req.method,
        status: 200,
        response: result
      });
      return res.json(result);

    } catch (error) {
      this.handleError(req, res, error, 'Failed to create authorization URL');
    }
  };

  public mercadoLivreCallback = async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      if (!code || typeof code !== 'string') {
        const response = { error: 'Authorization code is required' };
        logger.info({
          context: 'AuthMarketplaceController',
          action: 'mercadoLivreCallback',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }
      if (!state || typeof state !== 'string') {
        const response = { error: 'State parameter is required' };
        logger.info({
          context: 'AuthMarketplaceController',
          action: 'mercadoLivreCallback',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }

      const result = await this.mercadoLivreService.exchangeCodeForToken(code, state);
      logger.info({
        context: 'AuthMarketplaceController',
        action: 'mercadoLivreCallback',
        route: req.originalUrl,
        method: req.method,
        status: 200,
        response: result
      });
      res.json(result);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  public shopeeCallback = async (req: Request, res: Response) => {
    try {
      const { code, shop_id, state } = req.query;
      if (!code || !shop_id || typeof code !== 'string' || typeof shop_id !== 'string') {
        const response = { error: 'Authorization code and shop_id are required' };
        logger.info({
          context: 'AuthMarketplaceController',
          action: 'shopeeCallback',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }
      if (!state || typeof state !== 'string') {
        const response = { error: 'State parameter (userMarketplaceId) is required' };
        logger.info({
          context: 'AuthMarketplaceController',
          action: 'shopeeCallback',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }

      const result = await this.shopeeService.exchangeCodeForToken(code, shop_id, state);
      logger.info({
        context: 'AuthMarketplaceController',
        action: 'shopeeCallback',
        route: req.originalUrl,
        method: req.method,
        status: 200,
        response: result
      });
      res.json(result);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  public tiktokshopCallback = async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      if (!code || typeof code !== 'string') {
        const response = { error: 'Authorization code is required' };
        logger.info({
          context: 'AuthMarketplaceController',
          action: 'tiktokshopCallback',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }
      if (!state || typeof state !== 'string') {
        const response = { error: 'State parameter (userMarketplaceId) is required' };
        logger.info({
          context: 'AuthMarketplaceController',
          action: 'tiktokshopCallback',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }

      const result = await this.tiktokshopService.exchangeCodeForToken(code, state);
      logger.info({
        context: 'AuthMarketplaceController',
        action: 'tiktokshopCallback',
        route: req.originalUrl,
        method: req.method,
        status: 200,
        response: result
      });
      res.json(result);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  public refreshToken = async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response = { errors: errors.array() };
        logger.info({
          context: 'AuthMarketplaceController',
          action: 'refreshToken',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }

      const { userMarketplaceId } = req.body;
      const userMarketplace = await this.userMarketplaceService.findById(userMarketplaceId);

      if (!userMarketplace) {
        const response = { error: 'User marketplace not found' };
        logger.info({
          context: 'AuthMarketplaceController',
          action: 'refreshToken',
          route: req.originalUrl,
          method: req.method,
          status: 404,
          response
        });
        return res.status(404).json(response);
      }

      let result;
      switch (userMarketplace.type) {
        case 'ml': {
          result = await this.mercadoLivreService.refreshAccessToken(userMarketplaceId);
          break;
        }
        case 'sh': {
          result = await this.shopeeService.refreshAccessToken(userMarketplaceId);
          break;
        }
        case 'tk': {
          result = await this.tiktokshopService.refreshAccessToken(userMarketplaceId);
          break;
        }
        default:
          const response = { error: 'Unsupported marketplace type' };
          logger.info({
            context: 'AuthMarketplaceController',
            action: 'refreshToken',
            route: req.originalUrl,
            method: req.method,
            status: 400,
            response
          });
          return res.status(400).json(response);
      }

      logger.info({
        context: 'AuthMarketplaceController',
        action: 'refreshToken',
        route: req.originalUrl,
        method: req.method,
        status: 200,
        response: result
      });
      return res.json(result);

    } catch (error: any) {
      this.handleError(req, res, error);
    }
  };
}
