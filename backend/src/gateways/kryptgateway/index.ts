import axios from 'axios';
import { GatewayAdapter, ChargeRequest, ChargeResponse, StatusResponse } from '../interfaces';
import { config } from '../../config';

const API_URL = 'https://kryptgateway.netlify.app';

export class KryptGatewayAdapter implements GatewayAdapter {
  name = 'kryptgateway';

  private getCredentials(userClientId?: string, userClientSecret?: string) {
    return {
      ci: userClientId || config.gateways.kryptgateway.clientId,
      cs: userClientSecret || config.gateways.kryptgateway.clientSecret,
    };
  }

  async createCharge(request: ChargeRequest, userClientId?: string, userClientSecret?: string): Promise<ChargeResponse> {
    const creds = this.getCredentials(userClientId, userClientSecret);
    try {
      const response = await axios.post(
        `${API_URL}/api/gateway/pix-create`,
        {
          amount: request.amount,
          payerName: request.customer.name,
          payerDocument: request.customer.document,
          description: request.description,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'ci': creds.ci,
            'cs': creds.cs,
          },
        }
      );
      const d = response.data.data;
      return {
        transactionId: d.transactionId,
        status: this.mapStatus(d.status),
        qrCodeBase64: d.qrCodeBase64,
        copyPaste: d.copyPaste,
        paymentLink: d.paymentLink,
        expiresAt: d.expiresAt,
        fee: d.fee,
        netAmount: d.netAmount,
        raw: d,
      };
    } catch (error: any) {
      throw new Error(`KryptGateway charge error: ${error.response?.data?.error || error.message}`);
    }
  }

  async checkStatus(transactionId: string, userClientId?: string, userClientSecret?: string): Promise<StatusResponse> {
    const creds = this.getCredentials(userClientId, userClientSecret);
    try {
      const response = await axios.get(`${API_URL}/api/gateway/pix-status`, {
        params: { transactionId },
        headers: { 'ci': creds.ci, 'cs': creds.cs },
      });
      const d = response.data.data;
      return {
        transactionId: d.transactionId,
        status: this.mapStatus(d.status),
        amount: d.amount,
        fee: d.fee,
        netAmount: d.netAmount,
        payerName: d.payerName,
        paidAt: d.paidAt,
        raw: d,
      };
    } catch (error: any) {
      return { transactionId, status: 'unknown' };
    }
  }

  verifyWebhook(_payload: any, _signature: string, _timestamp?: string): boolean {
    return true;
  }

  private mapStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'pending',
      paid: 'paid',
      expired: 'expired',
      cancelled: 'cancelled',
    };
    return map[status] || 'pending';
  }
}
