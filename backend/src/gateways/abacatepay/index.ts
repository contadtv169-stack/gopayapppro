import axios from 'axios';
import crypto from 'crypto';
import { GatewayAdapter, ChargeRequest, ChargeResponse, StatusResponse } from '../interfaces';
import { config } from '../../config';

const API_URL = 'https://api.abacatepay.com/v1';

export class AbacatePayAdapter implements GatewayAdapter {
  name = 'abacatepay';

  private getApiKey(userApiKey?: string): string {
    return userApiKey || config.gateways.abacatepay.apiKey;
  }

  async createCharge(request: ChargeRequest, userApiKey?: string): Promise<ChargeResponse> {
    const apiKey = this.getApiKey(userApiKey);
    try {
      const response = await axios.post(
        `${API_URL}/pixQrCode/create`,
        {
          amount: Math.round(request.amount * 100),
          expiresIn: 3600,
          description: request.description,
          metadata: { externalId: request.externalId },
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const d = response.data.data;
      return {
        transactionId: d.id,
        status: this.mapStatus(d.status),
        qrCode: d.brCode,
        qrCodeBase64: d.brCodeBase64,
        copyPaste: d.brCode,
        expiresAt: d.expiresAt,
        fee: d.platformFee ? d.platformFee / 100 : undefined,
        raw: d,
      };
    } catch (error: any) {
      throw new Error(`AbacatePay charge error: ${error.response?.data?.error || error.message}`);
    }
  }

  async checkStatus(transactionId: string, userApiKey?: string): Promise<StatusResponse> {
    const apiKey = this.getApiKey(userApiKey);
    try {
      const response = await axios.get(`${API_URL}/pixQrCode/${transactionId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const d = response.data.data;
      return {
        transactionId: d.id,
        status: this.mapStatus(d.status),
        amount: d.amount,
        paidAt: d.updatedAt,
        raw: d,
      };
    } catch (error: any) {
      return { transactionId, status: 'unknown' };
    }
  }

  verifyWebhook(payload: any, signature: string, timestamp?: string): boolean {
    const secret = config.gateways.abacatepay.webhookSecret;
    if (!secret || !signature) return false;
    try {
      const raw = JSON.stringify(payload);
      const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  private mapStatus(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'pending',
      PAID: 'paid',
      EXPIRED: 'expired',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded',
    };
    return map[status] || 'pending';
  }
}
