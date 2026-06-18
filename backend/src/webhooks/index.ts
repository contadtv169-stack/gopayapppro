import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { orderService } from '../services/order.service';
import { notificationService } from '../services/notification.service';
import { AbacatePayAdapter } from '../gateways/abacatepay';
import { KryptGatewayAdapter } from '../gateways/kryptgateway';
import { PixGoAdapter } from '../gateways/pixgo';
import { gatewayCredentialService } from '../services/gateway-credential.service';
import { webhookLimiter } from '../middleware/rateLimit';
import { config } from '../config';

const router = Router();
router.use(webhookLimiter);

const abacatepay = new AbacatePayAdapter();
const kryptgateway = new KryptGatewayAdapter();
const pixgo = new PixGoAdapter();

// --- KryptGateway Webhook ---
router.post('/kryptgateway', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const event = payload.event || 'payment.update';

    await supabase.from('webhooks_log').insert({
      gateway: 'kryptgateway',
      event,
      payload,
      headers: JSON.stringify(req.headers),
      signature_valid: true,
    });

    if (payload.data?.transactionId) {
      const transactionId = payload.data.transactionId;
      const newStatus = payload.data.status;

      const { data: order } = await supabase.from('orders')
        .select('*, users(id)').eq('gateway_transaction_id', transactionId).single();

      if (order && order.status !== 'paid') {
        const mappedStatus = newStatus === 'completed' || newStatus === 'paid' ? 'paid' : newStatus;
        const updated = await orderService.updateStatus(order.id, mappedStatus, transactionId);
        if (mappedStatus === 'paid') {
          await notificationService.notifyPaymentConfirmed(updated);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    await supabase.from('webhooks_log').insert({
      gateway: 'kryptgateway', payload: req.body, error: error.message, processed: false, headers: JSON.stringify(req.headers), signature_valid: false,
    });
    res.status(200).json({ received: true });
  }
});

// --- AbacatePay Webhook ---
router.post('/abacatepay', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-webhook-signature'] as string || req.headers['x-signature'] as string;

    const valid = abacatepay.verifyWebhook(payload, signature);
    if (!valid) {
      await supabase.from('webhooks_log').insert({
        gateway: 'abacatepay', payload, headers: JSON.stringify(req.headers), signature_valid: false, event: payload.event,
      });
      return res.status(200).json({ received: true });
    }

    await supabase.from('webhooks_log').insert({
      gateway: 'abacatepay', payload, headers: JSON.stringify(req.headers), signature_valid: true, event: payload.event,
    });

    if (payload.data?.id) {
      const transactionId = payload.data.id;
      const newStatus = payload.data.status;

      const { data: order } = await supabase.from('orders')
        .select('*').eq('gateway_transaction_id', transactionId).single();

      if (order && order.status !== 'paid') {
        const mappedStatus = newStatus === 'PAID' ? 'paid' : newStatus === 'EXPIRED' ? 'expired' : newStatus === 'CANCELLED' ? 'cancelled' : newStatus === 'REFUNDED' ? 'refunded' : 'pending';
        const updated = await orderService.updateStatus(order.id, mappedStatus, transactionId);
        if (mappedStatus === 'paid') await notificationService.notifyPaymentConfirmed(updated);
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    await supabase.from('webhooks_log').insert({
      gateway: 'abacatepay', payload: req.body, error: error.message, processed: false, headers: JSON.stringify(req.headers), signature_valid: false,
    });
    res.status(200).json({ received: true });
  }
});

// --- PixGo Webhook ---
router.post('/pixgo', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;

    const valid = pixgo.verifyWebhook(payload, signature, timestamp);
    if (!valid) {
      await supabase.from('webhooks_log').insert({
        gateway: 'pixgo', payload, headers: JSON.stringify(req.headers), signature_valid: false, event: payload.event,
      });
      return res.status(200).json({ received: true });
    }

    await supabase.from('webhooks_log').insert({
      gateway: 'pixgo', payload, headers: JSON.stringify(req.headers), signature_valid: true, event: payload.event,
    });

    if (payload.data) {
      const transactionId = payload.data.payment_id;
      const externalId = payload.data.external_id;

      let orderId = externalId;
      const { data: orderByTxn } = await supabase.from('orders')
        .select('*').eq('gateway_transaction_id', transactionId).single();
      
      const { data: orderByExt } = orderByTxn ? { data: null } : await supabase.from('orders')
        .select('*').eq('id', externalId).single();

      const order = orderByTxn || orderByExt;

      if (order && order.status !== 'paid') {
        let newStatus = 'pending';
        if (payload.event === 'payment.completed') newStatus = 'paid';
        else if (payload.event === 'payment.expired') newStatus = 'expired';
        else if (payload.event === 'payment.cancelled') newStatus = 'cancelled';
        else if (payload.event === 'payment.refunded') newStatus = 'refunded';

        const netAmount = payload.data.amounts?.net || payload.data.amount;
        const updated = await orderService.updateStatus(order.id, newStatus, transactionId);

        if (netAmount && netAmount !== order.amount) {
          await supabase.from('orders').update({ net_amount: netAmount }).eq('id', order.id);
        }

        if (newStatus === 'paid') await notificationService.notifyPaymentConfirmed(updated);
        else if (newStatus === 'expired') await notificationService.notifyPaymentExpired(updated);
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    await supabase.from('webhooks_log').insert({
      gateway: 'pixgo', payload: req.body, error: error.message, processed: false, headers: JSON.stringify(req.headers), signature_valid: false,
    });
    res.status(200).json({ received: true });
  }
});

// --- Generic Webhook for direct gateway callback ---
router.post('/gateway/:name', async (req: Request, res: Response) => {
  const gateway = req.params.name;
  const payload = req.body;

  await supabase.from('webhooks_log').insert({
    gateway, payload, headers: JSON.stringify(req.headers), event: payload.event || 'unknown',
  });

  if (payload.transactionId || payload.id || payload.payment_id) {
    const transactionId = payload.transactionId || payload.id || payload.payment_id;
    const status = payload.status === 'paid' || payload.status === 'completed' || payload.status === 'PAID' ? 'paid' : payload.status;

    const { data: order } = await supabase.from('orders')
      .select('*').eq('gateway_transaction_id', transactionId).single();

    if (order) {
      await orderService.updateStatus(order.id, status, transactionId);
    }
  }

  res.status(200).json({ received: true });
});

export default router;
