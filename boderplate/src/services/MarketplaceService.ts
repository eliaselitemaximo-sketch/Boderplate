interface MarketplaceCredentials {
  mercadolivre: {
    name: string;
    webhookUrl: string;
    clientKey: string;
    redirectUrl: string;
  };
  shopee: {
    name: string;
    webhookUrl: string;
    clientKey: string;
    redirectUrl: string;
  };
  tiktokshop: {
    name: string;
    webhookUrl: string;
    clientKey: string;
    redirectUrl: string;
  };
}

export class MarketplaceService {
  getCredentials(): MarketplaceCredentials {
    return {
      mercadolivre: {
        name: process.env.NAME_APP_ML || '',
        webhookUrl: process.env.WEBHOOK_URL_ML || '',
        clientKey: process.env.CLIENT_KEY_ML || '',
        redirectUrl: process.env.REDIRECT_URL_ML || '',
      },
      shopee: {
        name: process.env.NAME_APP_SH || '',
        webhookUrl: process.env.WEBHOOK_URL_SH || '',
        clientKey: process.env.CLIENT_KEY_SH || '',
        redirectUrl: process.env.REDIRECT_URL_SH || '',
      },
      tiktokshop: {
        name: process.env.NAME_APP_TK || '',
        webhookUrl: process.env.WEBHOOK_URL_TK || '',
        clientKey: process.env.CLIENT_KEY_TK || '',
        redirectUrl: process.env.REDIRECT_URL_TK || '',
      },
    };
  }

  getWebhookConfig() {
    return {
      mercadolivre: process.env.WEBHOOK_URL_ML || '',
      shopee: process.env.WEBHOOK_URL_SH || '',
      tiktokshop: process.env.WEBHOOK_URL_TK || '',
    };
  }
}
