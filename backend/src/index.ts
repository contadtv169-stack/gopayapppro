import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { apiLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import paymentLinkRoutes from './routes/payment-link.routes';
import checkoutRoutes from './routes/checkout.routes';
import gatewayRoutes from './routes/gateway.routes';
import notificationRoutes from './routes/notification.routes';
import customizationRoutes from './routes/customization.routes';
import webhookRoutes from './webhooks/index';

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [config.app.frontendUrl, 'http://localhost:5173', 'http://localhost:3000', 'https://gopayapppro.vercel.app'],
  credentials: true,
}));

app.use('/webhooks', express.raw({ type: 'application/json' }), (req: any, _res, next) => {
  if (req.body) req.rawBody = req.body.toString();
  next();
}, express.json());

app.use((req, _res, next) => {
  if (req.path.startsWith('/webhooks')) return next();
  express.json()(req, _res, next);
});

app.use(apiLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'gopay-backend', version: '1.0.0' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment-links', paymentLinkRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/gateways', gatewayRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/webhooks', webhookRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(config.app.port, () => {
  console.log(`GoPay Backend running on port ${config.app.port} [${config.app.env}]`);
  console.log(`Supabase: ${config.supabase.url}`);
});

export default app;
