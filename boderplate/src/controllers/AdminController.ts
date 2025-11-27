import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../infra/logs/logger';

export class AdminController {
  public login = async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.body;

      if (!apiKey || apiKey !== process.env.API_KEY) {
        const response = { error: 'Invalid API key' };
        logger.info({
          context: 'AdminController',
          action: 'login',
          route: req.originalUrl,
          method: req.method,
          status: 401,
          response
        });
        return res.status(401).json(response);
      }

      const secret = process.env.SESSION_SECRET || process.env.API_KEY || 'default_secret';
      const token = jwt.sign({ userId: 'admin' }, secret, { expiresIn: '7d' });

      const response = { token, expiresIn: '7d' };
      logger.info({
        context: 'AdminController',
        action: 'login',
        route: req.originalUrl,
        method: req.method,
        status: 200,
        response
      });
      res.json(response);
    } catch (error) {
      const response = { error: 'Internal server error' };
      logger.error({
        context: 'AdminController',
        action: 'login',
        route: req.originalUrl,
        method: req.method,
        status: 500,
        response,
        error
      });
      res.status(500).json(response);
    }
  };

  public verify = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        const response = { error: 'Token is required' };
        logger.info({
          context: 'AdminController',
          action: 'verify',
          route: req.originalUrl,
          method: req.method,
          status: 400,
          response
        });
        return res.status(400).json(response);
      }

      const secret = process.env.SESSION_SECRET || process.env.API_KEY || 'default_secret';
      const decoded = jwt.verify(token, secret);

      const response = { valid: true, decoded };
      logger.info({
        context: 'AdminController',
        action: 'verify',
        route: req.originalUrl,
        method: req.method,
        status: 200,
        response
      });
      res.json(response);
    } catch (error) {
      const response = { valid: false, error: 'Invalid token' };
      logger.info({
        context: 'AdminController',
        action: 'verify',
        route: req.originalUrl,
        method: req.method,
        status: 401,
        response
      });
      res.status(401).json(response);
    }
  };
}
