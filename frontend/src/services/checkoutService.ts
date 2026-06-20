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
}) {
  const orderId = crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now().toString(36));
  const pixKey = getSellerPixKey();
  const pixBrCode = buildPixBRCode(params.amount, orderId, pixKey, 'GoPay', 'BRASILIA');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixBrCode)}`;

  // Check for active gateway credentials
  let gateway = 'gopay';
  try {
    const { data: gwCreds } = await supabase.from('gateway_credentials').select('*').eq('user_id', params.seller_id).eq('is_active', true).maybeSingle();
    if (gwCreds) {
      gateway = gwCreds.gateway;
    }
  } catch {}

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
    pix_code: pixBrCode,
    pix_qr: qrUrl,
    expires_at: new Date(Date.now() + 1200 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('orders').insert(order);
  if (error) throw error;
  return { ...order, copyPaste: pixBrCode, qrCodeBase64: qrUrl };
}

export async function getOrderStatus(orderId: string) {
  const { data, error } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle();
  if (error) return 'pending';
  return data?.status || 'pending';
}
