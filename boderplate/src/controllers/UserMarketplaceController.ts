import { Response } from 'express';
import { validationResult } from 'express-validator';
import { UserMarketplaceService } from '../services/UserMarketplaceService';
import { AuthRequest } from '../middleware/authMiddleware';
import logger from '../infra/logs/logger';

export class UserMarketplaceController {
  private service: UserMarketplaceService;

  constructor() {
    this.service = new UserMarketplaceService();
  }

  public create = async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response = { errors: errors.array() };
        logger.info({
          context: 'UserMarketplaceController',
          action: 'create',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }

      const result = await this.service.create(req.body);
      logger.info({
        context: 'UserMarketplaceController',
        action: 'create',
        route: req.originalUrl,
        method: req.method,
        status: 201,
        response: result
      });
      res.status(201).json(result);
    } catch (error) {
      const response = { error: 'Internal server error' };
      logger.error({
        context: 'UserMarketplaceController',
        action: 'create',
        route: req.originalUrl,
        method: req.method,
        status: 500,
        response,
        error
      });
      res.status(500).json(response);
    }
  };

  public findAll = async (req: AuthRequest, res: Response) => {
    try {
      const results = await this.service.findAll();
      logger.info({
        context: 'UserMarketplaceController',
        action: 'findAll',
        route: req.originalUrl,
        method: req.method,
        status: 200,
        response: results
      });
      res.json(results);
    } catch (error) {
      const response = { error: 'Internal server error' };
      logger.error({
        context: 'UserMarketplaceController',
        action: 'findAll',
        route: req.originalUrl,
        method: req.method,
        status: 500,
        response,
        error
      });
      res.status(500).json(response);
    }
  };

  public findById = async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response = { errors: errors.array() };
        logger.info({
          context: 'UserMarketplaceController',
          action: 'findById',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }

      const result = await this.service.findById(req.params.id);
      if (!result) {
        const response = { error: 'Not found' };
        logger.info({
          context: 'UserMarketplaceController',
          action: 'findById',
          route: req.originalUrl,
          method: req.method,
          status: 404,
          response
        });
        return res.status(404).json(response);
      }
      logger.info({
        context: 'UserMarketplaceController',
        action: 'findById',
        route: req.originalUrl,
        method: req.method,
        status: 200,
        response: result
      });
      res.json(result);
    } catch (error) {
      const response = { error: 'Internal server error' };
      logger.error({
        context: 'UserMarketplaceController',
        action: 'findById',
        route: req.originalUrl,
        method: req.method,
        status: 500,
        response,
        error
      });
      res.status(500).json(response);
    }
  };

  public update = async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response = { errors: errors.array() };
        logger.info({
          context: 'UserMarketplaceController',
          action: 'update',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }

      const result = await this.service.update(req.params.id, req.body);
      if (!result) {
        const response = { error: 'Not found' };
        logger.info({
          context: 'UserMarketplaceController',
          action: 'update',
          route: req.originalUrl,
          method: req.method,
          status: 404,
          response
        });
        return res.status(404).json(response);
      }
      logger.info({
        context: 'UserMarketplaceController',
        action: 'update',
        route: req.originalUrl,
        method: req.method,
        status: 200,
        response: result
      });
      res.json(result);
    } catch (error) {
      const response = { error: 'Internal server error' };
      logger.error({
        context: 'UserMarketplaceController',
        action: 'update',
        route: req.originalUrl,
        method: req.method,
        status: 500,
        response,
        error
      });
      res.status(500).json(response);
    }
  };

  public delete = async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response = { errors: errors.array() };
        logger.info({
          context: 'UserMarketplaceController',
          action: 'delete',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }

      const success = await this.service.delete(req.params.id);
      if (!success) {
        const response = { error: 'Not found' };
        logger.info({
          context: 'UserMarketplaceController',
          action: 'delete',
          route: req.originalUrl,
          method: req.method,
          status: 404,
          response
        });
        return res.status(404).json(response);
      }
      logger.info({
        context: 'UserMarketplaceController',
        action: 'delete',
        route: req.originalUrl,
        method: req.method,
        status: 204,
        response: '(No Content)'
      });
      res.status(204).send();
    } catch (error) {
      const response = { error: 'Internal server error' };
      logger.error({
        context: 'UserMarketplaceController',
        action: 'delete',
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
