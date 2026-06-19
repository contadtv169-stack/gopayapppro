import { supabase } from './supabase';

export async function getProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createProduct(p: { name: string; description?: string; price: number; image_url?: string }) {
  const { data, error } = await supabase.from('products').insert(p).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, p: any) {
  const { error } = await supabase.from('products').update(p).eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function getOrders(filter?: string) {
  let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (filter) q = q.eq('status', filter);
  const { data, error } = await q;
  if (error) throw error;
  return { data: data || [], total: data?.length || 0, page: 1, limit: 50 };
}

export async function getPaymentLinks() {
  const { data, error } = await supabase.from('payment_links').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPaymentLink(p: { title: string; description?: string; amount: number; slug: string }) {
  const { data, error } = await supabase.from('payment_links').insert(p).select().single();
  if (error) throw error;
  return data;
}

export async function deletePaymentLink(id: string) {
  const { error } = await supabase.from('payment_links').delete().eq('id', id);
  if (error) throw error;
}

export async function getNotifications() {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(id: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function getUnreadCount() {
  const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false);
  if (error) return 0;
  return count || 0;
}

export async function getDashboardStats() {
  const { data: orders, error } = await supabase.from('orders').select('amount, status, net_amount');
  if (error) return { totalOrders: 0, totalRevenue: 0, totalPaid: 0, totalNet: 0, pendingOrders: 0 };
  const paid = orders.filter(o => o.status === 'paid');
  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((s: number, o: any) => s + Number(o.amount), 0),
    totalPaid: paid.reduce((s: number, o: any) => s + Number(o.amount), 0),
    totalNet: paid.reduce((s: number, o: any) => s + Number(o.net_amount || o.amount), 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length,
  };
}
