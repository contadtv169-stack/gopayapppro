import { supabase } from './supabase';
import { createOrderNotification } from './notificationService';

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

function getSellerPixKey(sellerId?: string) {
  try {
    const u = localStorage.getItem('gopay_user');
    if (u) {
      const parsed = JSON.parse(u);
      return parsed.phone || parsed.pix_key || parsed.email || '';
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

async function getSellerProfile(sellerId: string) {
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', sellerId).maybeSingle();
    if (data?.business_name) return data.business_name;
  } catch {}
  try {
    const { data } = await supabase.from('users').select('business_name, phone, pix_key').eq('id', sellerId).maybeSingle();
    if (data?.business_name) return data.business_name;
  } catch {}
  return 'Vendedor';
}

export async function getCheckoutProduct(slug: string) {
  const { data: product } = await supabase.from('products').select('*').eq('id', slug).maybeSingle();
  if (!product) {
    const { data: p2 } = await supabase.from('products').select('*').eq('checkout_url', slug).maybeSingle();
    return p2 || null;
  }
  return product;
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

  const pixKey = getSellerPixKey(params.seller_id);
  const pixBrCode = buildPixBRCode(params.amount, orderId, pixKey, 'GoPay', 'BRASILIA');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixBrCode)}`;

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
    gateway: 'gopay',
    pix_code: pixBrCode,
    pix_qr: qrUrl,
    expires_at: new Date(Date.now() + 1200 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };

  let orderResult = { ...order, copyPaste: pixBrCode, qrCodeBase64: qrUrl };

  try {
    const { error } = await supabase.from('orders').insert(order);
    if (error) {
      if (error.message?.includes('column') || error.code === '42703') {
        const minimalOrder = {
          id: orderId, user_id: params.seller_id, customer_name: params.customer_name,
          customer_email: params.customer_email, customer_phone: params.customer_phone,
          customer_document: params.customer_document, amount: params.amount,
          status: 'pending', payment_method: 'pix', created_at: new Date().toISOString(),
        };
        const { error: e2 } = await supabase.from('orders').insert(minimalOrder);
        if (e2) throw e2;
        localStorage.setItem(`gopay_pix_${orderId}`, JSON.stringify({ pixCode: pixBrCode, qrUrl }));
      } else {
        throw error;
      }
    }
  } catch (err: any) {
    if (err.message?.includes('column') || err.code === '42703') {
      const localOrders = JSON.parse(localStorage.getItem('gopay_local_orders') || '[]');
      localOrders.push(order);
      localStorage.setItem('gopay_local_orders', JSON.stringify(localOrders));
    } else {
      throw err;
    }
  }

  createOrderNotification(params.seller_id, {
    id: orderId,
    customer_name: params.customer_name,
    amount: params.amount,
    product_id: params.product_id,
  });

  return orderResult;
}

export async function getOrderStatus(orderId: string) {
  try {
    const { data, error } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle();
    if (error) {
      const localOrders = JSON.parse(localStorage.getItem('gopay_local_orders') || '[]');
      const found = localOrders.find((o: any) => o.id === orderId);
      return found?.status || 'pending';
    }
    return data?.status || 'pending';
  } catch {
    return 'pending';
  }
}

export async function getCheckoutLink(slug: string) {
  const { data, error } = await supabase.from('payment_links').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (error) return null;
  return data;
}

export { getSellerProfile };