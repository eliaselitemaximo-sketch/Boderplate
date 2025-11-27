import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { adminRouter } from './routes/AdminRoutes';
import { userMarketplaceRouter } from './routes/UserMarketplaceRoutes';
import { authMarketplaceRouter } from './routes/AuthMarketplaceRoutes';
import { marketplaceRouter } from './routes/MarketplaceRoutes';
import { webhookRouter } from './routes/WebhookRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Marketplace Boilerplate API is running' });
});

app.use('/api/auth', adminRouter);
app.use('/api/marketplace/webhook', webhookRouter);
app.use('/api/marketplace/user', userMarketplaceRouter);
app.use('/api/marketplace/auth', authMarketplaceRouter);
app.use('/api/marketplace', marketplaceRouter);



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});