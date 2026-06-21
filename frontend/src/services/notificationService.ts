import { supabase } from './supabase';

export async function createOrderNotification(sellerId: string, order: {
  id: string;
  customer_name?: string;
  amount: number;
  product_id?: string;
}) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: sellerId,
      type: 'payment',
      title: 'Nova venda recebida!',
      message: `Pedido de ${order.customer_name || 'cliente'} - R$ ${Number(order.amount).toFixed(2)}`,
      data: { order_id: order.id, amount: order.amount, customer: order.customer_name, product: order.product_id },
      order_id: order.id,
      is_read: false,
      created_at: new Date().toISOString(),
    });
    if (error) console.warn('Notification insert error:', error.message);
  } catch (err) {
    console.warn('Notification service error:', err);
  }
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification('Nova venda! 🎉', {
        body: `${order.customer_name || 'Cliente'} comprou - R$ ${Number(order.amount).toFixed(2)}`,
        icon: './icons/icon-192.png',
        tag: `order-${order.id}`,
      });
    }
  } catch {}
}

export async function getNotifications(userId: string) {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
  if (error) return [];
  return data || [];
}

export async function markNotificationRead(id: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllRead(userId: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}

export async function getUnreadCount(userId: string) {
  const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
  return count || 0;
}