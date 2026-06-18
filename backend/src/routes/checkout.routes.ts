import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { orderService } from '../services/order.service';
import { productService } from '../services/product.service';
import { paymentLinkService } from '../services/payment-link.service';
import { gatewayCredentialService } from '../services/gateway-credential.service';
import { notificationService } from '../services/notification.service';
import { AbacatePayAdapter } from '../gateways/abacatepay';
import { KryptGatewayAdapter } from '../gateways/kryptgateway';
import { PixGoAdapter } from '../gateways/pixgo';
import { config } from '../config';
import { checkoutLimiter } from '../middleware/rateLimit';

const router = Router();
router.use(checkoutLimiter);

const gateways: Record<string, any> = {
  abacatepay: new AbacatePayAdapter(),
  kryptgateway: new KryptGatewayAdapter(),
  pixgo: new PixGoAdapter(),
};

async function getGatewayForUser(userId: string) {
  const creds = await gatewayCredentialService.list(userId);
  if (creds.length === 0) return null;
  const active = creds.find(c => c.is_active);
  if (!active) return null;
  return active.gateway;
}

router.get('/product/:slug', async (req: Request, res: Response) => {
  try {
    const product = await productService.getByCheckoutUrl(req.params.slug);
    res.json(product);
  } catch (error: any) {
    res.status(404).json({ error: 'Produto não encontrado' });
  }
});

router.get('/link/:slug', async (req: Request, res: Response) => {
  try {
    const link = await paymentLinkService.getBySlug(req.params.slug);
    res.json(link);
  } catch (error: any) {
    res.status(404).json({ error: 'Link não encontrado' });
  }
});

router.post('/product/:slug', async (req: Request, res: Response) => {
  try {
    const product = await productService.getByCheckoutUrl(req.params.slug);
    const { name, email, phone, document, gateway: preferredGateway } = req.body;

    if (!name) return res.status(400).json({ error: 'Nome do comprador é obrigatório' });

    const gatewayName = preferredGateway || (await getGatewayForUser(product.user_id)) || 'pixgo';
    const adapter = gateways[gatewayName];
    if (!adapter) return res.status(400).json({ error: 'Gateway não disponível' });

    const externalId = `pedido_${product.id}_${Date.now()}`;

    const order = await orderService.create({
      user_id: product.user_id,
      product_id: product.id,
      customer_name: name,
      customer_email: email || null,
      customer_phone: phone || null,
      customer_document: document || null,
      amount: Number(product.price),
      gateway: gatewayName,
      status: 'pending',
      expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    });

    const creds = await gatewayCredentialService.get(product.user_id, gatewayName);
    let charge;
    if (gatewayName === 'kryptgateway') {
      charge = await adapter.createCharge(
        { amount: Number(product.price), description: product.name, customer: { name, email, phone, document }, externalId, webhookUrl: `${config.app.url}/webhooks/${gatewayName}` },
        creds?.apiKey, creds?.secret
      );
    } else {
      charge = await adapter.createCharge(
        { amount: Number(product.price), description: product.name, customer: { name, email, phone, document }, externalId, webhookUrl: `${config.app.url}/webhooks/${gatewayName}` },
        creds?.apiKey
      );
    }

    await orderService.updateStatus(order.id, charge.status === 'paid' ? 'paid' : 'pending', charge.transactionId);

    res.status(201).json({
      orderId: order.id,
      transactionId: charge.transactionId,
      status: charge.status,
      qrCode: charge.qrCode || null,
      qrCodeBase64: charge.qrCodeBase64 || null,
      copyPaste: charge.copyPaste || null,
      paymentLink: charge.paymentLink || null,
      expiresAt: charge.expiresAt || order.expires_at,
      amount: Number(product.price),
      gateway: gatewayName,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/link/:slug', async (req: Request, res: Response) => {
  try {
    const link = await paymentLinkService.getBySlug(req.params.slug);
    const { name, email, phone, document } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome do comprador é obrigatório' });

    const gatewayName = (await getGatewayForUser(link.user_id)) || 'pixgo';
    const adapter = gateways[gatewayName];
    if (!adapter) return res.status(400).json({ error: 'Gateway não disponível' });

    const externalId = `link_${link.id}_${Date.now()}`;
    const amount = Number(link.amount);

    const order = await orderService.create({
      user_id: link.user_id,
      payment_link_id: link.id,
      customer_name: name,
      customer_email: email || null,
      customer_phone: phone || null,
      customer_document: document || null,
      amount,
      gateway: gatewayName,
      status: 'pending',
      expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    });

    const creds = await gatewayCredentialService.get(link.user_id, gatewayName);
    let charge;
    if (gatewayName === 'kryptgateway') {
      charge = await adapter.createCharge(
        { amount, description: link.title, customer: { name, email, phone, document }, externalId, webhookUrl: `${config.app.url}/webhooks/${gatewayName}` },
        creds?.apiKey, creds?.secret
      );
    } else {
      charge = await adapter.createCharge(
        { amount, description: link.title, customer: { name, email, phone, document }, externalId, webhookUrl: `${config.app.url}/webhooks/${gatewayName}` },
        creds?.apiKey
      );
    }

    await orderService.updateStatus(order.id, charge.status === 'paid' ? 'paid' : 'pending', charge.transactionId);

    res.status(201).json({
      orderId: order.id,
      transactionId: charge.transactionId,
      status: charge.status,
      qrCode: charge.qrCode || null,
      qrCodeBase64: charge.qrCodeBase64 || null,
      copyPaste: charge.copyPaste || null,
      paymentLink: charge.paymentLink || null,
      expiresAt: charge.expiresAt || order.expires_at,
      amount,
      gateway: gatewayName,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/order/:id/status', async (req: Request, res: Response) => {
  try {
    const order = await orderService.getById(req.params.id);
    res.json({ orderId: order.id, status: order.status, paidAt: order.paid_at });
  } catch (error: any) {
    res.status(404).json({ error: 'Pedido não encontrado' });
  }
});

export default router;
