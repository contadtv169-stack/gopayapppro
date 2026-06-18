import { supabase } from '../config/supabase';

export class OrderService {
  async list(userId: string, filters?: { status?: string; page?: number; limit?: number }) {
    let query = supabase.from('orders').select('*, products(name, price)').eq('user_id', userId).order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.range(from, to).select('*', { count: 'exact' });
    if (error) throw new Error(error.message);
    return { data: data || [], total: count || 0, page, limit };
  }

  async getById(id: string) {
    const { data, error } = await supabase.from('orders').select('*, products(*), transactions(*)').eq('id', id).single();
    if (error) throw new Error('Pedido não encontrado');
    return data;
  }

  async create(order: any) {
    const { data, error } = await supabase.from('orders').insert(order).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateStatus(id: string, status: string, gatewayTransactionId?: string) {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (gatewayTransactionId) updates.gateway_transaction_id = gatewayTransactionId;
    if (status === 'paid') updates.paid_at = new Date().toISOString();
    const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getStats(userId: string) {
    const { data: orders, error } = await supabase.from('orders').select('amount, net_amount, status').eq('user_id', userId);
    if (error) throw new Error(error.message);
    const total = orders?.reduce((sum: number, o: any) => sum + Number(o.amount), 0) || 0;
    const paid = orders?.filter((o: any) => o.status === 'paid') || [];
    const totalPaid = paid.reduce((sum: number, o: any) => sum + Number(o.amount), 0);
    const netPaid = paid.reduce((sum: number, o: any) => sum + Number(o.net_amount || o.amount), 0);
    return {
      totalOrders: orders?.length || 0,
      totalRevenue: total,
      totalPaid,
      totalNet: netPaid,
      paidOrders: paid.length,
      pendingOrders: orders?.filter((o: any) => o.status === 'pending').length || 0,
    };
  }

  async getRecent(userId: string, limit: number = 10) {
    const { data, error } = await supabase.from('orders').select('*, products(name)').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
    if (error) throw new Error(error.message);
    return data || [];
  }
}
export const orderService = new OrderService();
