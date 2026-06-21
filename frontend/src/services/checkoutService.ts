import { supabase } from './supabase';

function crc16(str: string) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function getSellerPixKey() {
  try {
    const u = localStorage.getItem('gopay_user');
    if (u) {
      const parsed = JSON.parse(u);
      return parsed.pix_key || parsed.document || parsed.email || '';
    }
  } catch {}
  return '';
}

function buildPixBRCode(amount: number, txid: string, pixKey: string, merchantName: string, merchantCity: string) {
  if (!pixKey) pixKey = 'gopay.pix.' + txid.slice(0, 8);
  const merchant = merchantName.slice(0, 25) || 'GoPay';
  const city = merchantCity.slice(0, 15) || 'BRASILIA';

  const gui = '0014br.gov.bcb.pix01' + pixKey.length.toString().padStart(2, '0') + pixKey;
  const txidFormatted = txid.slice(0, 25);

  let payload = '00020101021226' + gui.length.toString().padStart(2, '0') + gui;
  payload += '520400005303986';
  payload += '54' + amount.toFixed(2).length.toString().padStart(2, '0') + amount.toFixed(2);
  payload += '5802BR59' + merchant.length.toString().padStart(2, '0') + merchant;
  payload += '60' + city.length.toString().padStart(2, '0') + city;
  payload += '62070503' + txidFormatted.length.toString().padStart(2, '0') + txidFormatted;
  payload += '6304';

  return payload + crc16(payload);
}

const GATEWAY_ENDPOINTS: Record<string, string> = {
  kryptgateway: 'https://kryptgateway-api.onrender.com/api/v1',
  pixgo: 'https://api.pixgo.com.br/v1',
  abacatepay: 'https://api.abacatepay.com/v1',
};

async function processWithGateway(gateway: string, creds: any, params: {
  amount: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_document?: string;
  orderId: string;
}) {
  const gwName = gateway as string;
  const baseUrl = GATEWAY_ENDPOINTS[gwName];
  if (!baseUrl) return null;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (gwName === 'kryptgateway') {
    headers['Authorization'] = `Basic ${btoa(`${creds.encrypted_api_key}:${creds.encrypted_secret}`)}`;
  } else {
    headers['Authorization'] = `Bearer ${creds.encrypted_api_key}`;
  }

  const body: any = {
    amount: params.amount,
    customer: { name: params.customer_name, email: params.customer_email, phone: params.customer_phone, document: params.customer_document },
    reference: params.orderId,
    payment_method: 'pix',
  };

  const res = await fetch(`${baseUrl}/charges`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Gateway ${gwName} retornou erro ${res.status}`);

  const data = await res.json();
  const pixCode = data.pix?.code || data.pixCode || data.brCode || data.qr_code || '';
  const qrUrl = data.pix?.qrcode || data.qrCodeUrl || data.qr_code_url || '';

  return { pixCode, qrUrl };
}

async function createPixLocally(amount: number, orderId: string) {
  const pixKey = getSellerPixKey();
  const pixBrCode = buildPixBRCode(amount, orderId, pixKey, 'GoPay', 'BRASILIA');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixBrCode)}`;
  return { pixCode: pixBrCode, qrUrl };
}

export async function getCheckoutProduct(slug: string) {
  const { data: product, error } = await supabase.from('products').select('*').eq('id', slug).maybeSingle();
  if (!product) {
    const { data: p2 } = await supabase.from('products').select('*').eq('checkout_url', slug).maybeSingle();
    return p2 || null;
  }
  if (error) return null;
  return product;
}

export async function getCheckoutLink(slug: string) {
  const { data, error } = await supabase.from('payment_links').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (error) return null;
  return data;
}

export async function getCheckoutCustomizations(productId: string) {
  const { data } = await supabase.from('customizations').select('*').eq('product_id', productId).maybeSingle();
  return data || null;
}

export async function createCheckoutOrder(params: {
  product_id?: string;
  payment_link_id?: string;
  seller_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_document?: string;
  amount: number;
  preferred_gateway?: string;
}) {
  const orderId = crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now().toString(36));

  // Try selected gateway first, fall back to local Pix
  let pixCode = '';
  let qrUrl = '';
  let gateway = params.preferred_gateway || 'gopay';
  let gatewayError = '';

  try {
    if (gateway !== 'gopay') {
      const { data: gwCreds } = await supabase.from('gateway_credentials').select('*').eq('user_id', params.seller_id).eq('gateway', gateway).eq('is_active', true).maybeSingle();
      if (gwCreds) {
        const result = await processWithGateway(gateway, gwCreds, { ...params, orderId });
        if (result) {
          pixCode = result.pixCode;
          qrUrl = result.qrUrl;
        }
      } else {
        throw new Error('Gateway não encontrado');
      }
    }
  } catch (err: any) {
    gatewayError = err.message || 'Gateway indisponível';
    gateway = 'gopay';
  }

  // Fallback to local Pix if gateway failed or no gateway
  if (!pixCode) {
    const local = await createPixLocally(params.amount, orderId);
    pixCode = local.pixCode;
    qrUrl = local.qrUrl;
  }

  const order = {
    id: orderId,
    user_id: params.seller_id,
    product_id: params.product_id || null,
    payment_link_id: params.payment_link_id || null,
    customer_name: params.customer_name,
    customer_email: params.customer_email || null,
    customer_phone: params.customer_phone || null,
    customer_document: params.customer_document || null,
    amount: params.amount,
    net_amount: params.amount - 7,
    status: 'pending',
    payment_method: 'pix',
    gateway,
    pix_code: pixCode,
    pix_qr: qrUrl,
    gateway_error: gatewayError || null,
    expires_at: new Date(Date.now() + 1200 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };
  // Try insert with all columns, fallback to minimal insert if schema error
  let orderResult: any = { ...order, copyPaste: pixCode, qrCodeBase64: qrUrl };
  try {
    const { error } = await supabase.from('orders').insert(order);
    if (error) {
      if (error.message?.includes('column') || error.code === '42703') {
        // Schema missing columns - insert minimal and store Pix data locally
        const minimalOrder = {
          id: orderId, user_id: params.seller_id, customer_name: params.customer_name,
          customer_email: params.customer_email, customer_phone: params.customer_phone,
          customer_document: params.customer_document, amount: params.amount,
          status: 'pending', payment_method: 'pix', created_at: new Date().toISOString(),
        };
        const { error: e2 } = await supabase.from('orders').insert(minimalOrder);
        if (e2) throw e2;
        localStorage.setItem(`gopay_pix_${orderId}`, JSON.stringify({ pixCode, qrUrl, gateway }));
      } else {
        throw error;
      }
    }
  } catch (err: any) {
    // Last resort: store order locally
    if (err.message?.includes('column') || err.code === '42703') {
      // Store order locally
      const localOrders = JSON.parse(localStorage.getItem('gopay_local_orders') || '[]');
      localOrders.push(order);
      localStorage.setItem('gopay_local_orders', JSON.stringify(localOrders));
    } else {
      throw err;
    }
  }
  return orderResult;
}

export async function getOrderStatus(orderId: string) {
  try {
    const { data, error } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle();
    if (error) {
      // Check local storage
      const localOrders = JSON.parse(localStorage.getItem('gopay_local_orders') || '[]');
      const found = localOrders.find((o: any) => o.id === orderId);
      return found?.status || 'pending';
    }
    return data?.status || 'pending';
  } catch {
    return 'pending';
  }
}