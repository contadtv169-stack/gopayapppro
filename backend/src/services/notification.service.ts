import { supabase } from '../config/supabase';

export class NotificationService {
  async create(userId: string, type: string, title: string, message: string, data?: any) {
    const { data: result, error } = await supabase.from('notifications').insert({ user_id: userId, type, title, message, data: data || null }).select().single();
    if (error) throw new Error(error.message);
    return result;
  }

  async list(userId: string, unreadOnly: boolean = false) {
    let query = supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    if (unreadOnly) query = query.eq('is_read', false);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async markRead(id: string, userId: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }

  async markAllRead(userId: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    if (error) throw new Error(error.message);
    return true;
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    if (error) return 0;
    return count || 0;
  }

  async notifyPaymentConfirmed(order: any) {
    await this.create(order.user_id, 'payment_received', 'Pagamento Confirmado!', `Pedido #${order.id.slice(0, 8)} - R$ ${Number(order.amount).toFixed(2)}`, { order_id: order.id });
  }

  async notifyPaymentExpired(order: any) {
    await this.create(order.user_id, 'payment_expired', 'Pagamento Expirado', `Pedido #${order.id.slice(0, 8)} expirou`, { order_id: order.id });
  }
}
export const notificationService = new NotificationService();
