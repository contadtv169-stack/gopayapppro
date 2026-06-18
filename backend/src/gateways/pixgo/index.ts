import axios from 'axios';
import crypto from 'crypto';
import { GatewayAdapter, ChargeRequest, ChargeResponse, StatusResponse } from '../interfaces';
import { config } from '../../config';

const API_URL = 'https://pixgo.org/api/v1';

export class PixGoAdapter implements GatewayAdapter {
  name = 'pixgo';

  private getApiKey(userApiKey?: string): string {
    return userApiKey || config.gateways.pixgo.apiKey;
  }

  async createCharge(request: ChargeRequest, userApiKey?: string): Promise<ChargeResponse> {
    const apiKey = this.getApiKey(userApiKey);
    try {
      const body: any = {
        amount: request.amount,
        description: request.description,
        external_id: request.externalId,
      };
      if (request.customer.name) body.receiver_name = request.customer.name;
      if (request.customer.document) body.receiver_cpf = request.customer.document;
      if (request.customer.email) body.receiver_email = request.customer.email;
      if (request.customer.phone) body.receiver_phone = request.customer.phone;
      if (request.customer.address) body.receiver_address = request.customer.address;
      if (request.webhookUrl) body.webhook_url = request.webhookUrl;

      const response = await axios.post(`${API_URL}/payment/create`, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
      });
      const d = response.data.data;
      return {
        transactionId: d.payment_id,
        status: this.mapStatus(d.status),
        qrCode: d.qr_code,
        qrCodeBase64: undefined,
        copyPaste: d.qr_code,
        paymentLink: d.qr_image_url,
        expiresAt: d.expires_at,
        raw: d,
      };
    } catch (error: any) {
      throw new Error(`PixGo charge error: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
    }
  }

  async checkStatus(transactionId: string, userApiKey?: string): Promise<StatusResponse> {
    const apiKey = this.getApiKey(userApiKey);
    try {
      const response = await axios.get(`${API_URL}/payment/${transactionId}/status`, {
        headers: { 'X-API-Key': apiKey },
      });
      const d = response.data.data;
      return {
        transactionId: d.payment_id,
        status: this.mapStatus(d.status),
        amount: d.amount,
        payerName: d.customer_name,
        payerDocument: d.customer_cpf,
        paidAt: d.updated_at,
        raw: d,
      };
    } catch (error: any) {
      return { transactionId, status: 'unknown' };
    }
  }

  verifyWebhook(payload: any, signature: string, timestamp?: string): boolean {
    const secret = config.gateways.pixgo.webhookSecret;
    if (!secret || !signature || !timestamp) return false;
    try {
      const raw = JSON.stringify(payload);
      const signaturePayload = timestamp + '.' + raw;
      const expected = crypto.createHmac('sha256', secret).update(signaturePayload).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  }

  private mapStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'pending',
      completed: 'paid',
      paid: 'paid',
      expired: 'expired',
      cancelled: 'cancelled',
      refunded: 'refunded',
    };
    return map[status] || 'pending';
  }
}
