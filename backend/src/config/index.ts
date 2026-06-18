import dotenv from 'dotenv';
dotenv.config();

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || 'https://wnjpzsxrwwrskakrhfgg.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'gopay-jwt-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'gopay-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  app: {
    port: parseInt(process.env.PORT || '3001'),
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    url: process.env.APP_URL || 'http://localhost:3001',
  },
  gateways: {
    abacatepay: {
      apiKey: process.env.ABACATEPAY_API_KEY || '',
      webhookSecret: process.env.ABACATEPAY_WEBHOOK_SECRET || '',
    },
    kryptgateway: {
      clientId: process.env.KRYPT_CLIENT_ID || '',
      clientSecret: process.env.KRYPT_CLIENT_SECRET || '',
    },
    pixgo: {
      apiKey: process.env.PIXGO_API_KEY || '',
      webhookSecret: process.env.PIXGO_WEBHOOK_SECRET || '',
    },
  },
};
