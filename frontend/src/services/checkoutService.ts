import { supabase } from './supabase';

function generatePixCode(amount: number, orderId: string) {
  const merchantKey = 'gopay.pix' + orderId.slice(0, 8);
  const txid = orderId.slice(0, 25).toUpperCase();
  const payload = [
    '000201', '010212', '2683', '0014br.gov.bcb.pix',
    '01' + ('0' + (merchantKey.length + 2).toString()).slice(-2) + merchantKey,
    '02' + txid.length.toString().padStart(2, '0') + txid,
    '52040000', '5303986',
    '54' + ('0' + (amount.toFixed(2).length + 2).toString()).slice(-2) + amount.toFixed(2),
    '5802BR', '5905GoPay', '6008BRASILIA',
    '62140511GoPayPayment',
    '6304'
  ].join('');
  return { copyPaste: payload, qrCodeBase64: '' };
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
  const pix = generatePixCode(params.amount, orderId);
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
    pix_code: pix.copyPaste,
    pix_qr: pix.qrCodeBase64,
    expires_at: new Date(Date.now() + 1200 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('orders').insert(order);
  if (error) throw error;
  return { ...order, copyPaste: pix.copyPaste, qrCodeBase64: pix.qrCodeBase64 };
}

export async function getOrderStatus(orderId: string) {
  const { data, error } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle();
  if (error) return 'pending';
  return data?.status || 'pending';
}
