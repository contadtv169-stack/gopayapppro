export interface CustomerData {
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
}

export interface ChargeRequest {
  amount: number;
  description: string;
  customer: CustomerData;
  externalId: string;
  webhookUrl?: string;
}

export interface ChargeResponse {
  transactionId: string;
  status: string;
  qrCode?: string;
  qrCodeBase64?: string;
  copyPaste?: string;
  paymentLink?: string;
  expiresAt?: string;
  fee?: number;
  netAmount?: number;
  raw?: any;
}

export interface StatusResponse {
  transactionId: string;
  status: string;
  amount?: number;
  fee?: number;
  netAmount?: number;
  payerName?: string;
  payerDocument?: string;
  paidAt?: string;
  raw?: any;
}

export interface GatewayAdapter {
  name: string;
  createCharge(request: ChargeRequest): Promise<ChargeResponse>;
  checkStatus(transactionId: string): Promise<StatusResponse>;
  verifyWebhook(payload: any, signature: string, timestamp?: string): boolean;
}
